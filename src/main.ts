import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import moment from 'moment';
import { Notice, Plugin, Editor, FileSystemAdapter, MarkdownView, DataAdapter } from 'obsidian';
import { RemarkablePluginSettings, DEFAULT_SETTINGS } from 'config';
import { RemarkableSettingTab } from 'settings';


export default class RemarkablePlugin extends Plugin {
	settings: RemarkablePluginSettings = DEFAULT_SETTINGS;
	is_flatpak = false;

	async onload() {
		await this.loadSettings();
		await this.checkFlatpak();

		this.addCommand({
			id: 'insert-remarkable-drawing',
			name: 'Insert a drawing from the reMarkable',
			callback: () => this.tryInsertingDrawing(false),
		});

		this.addCommand({
			id: 'insert-remarkable-drawing-landscape',
			name: 'Insert a landscape-format drawing from the reMarkable',
			callback: () => this.tryInsertingDrawing(true),
		});

		this.addSettingTab(new RemarkableSettingTab(this.app, this));
	}

	onunload(): void {
		this.is_flatpak = false;
	}

	// #region Settings
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	// #endregion

	// #region processes
	async checkFlatpak() {
		const { stderr } = await this.runProcess('which', ['flatpak-spawn']);

		if(stderr !== '') {
			this.is_flatpak = false;
			return;
		}

		this.is_flatpak = true;
	}

	async runProcess(executable_path: string, args: string[]): Promise<Record<'stderr' | 'stdout', string>> {
		const outputs: Record<'stderr' | 'stdout', string> = {
			'stderr': '',
			'stdout': '',
		};

		return new Promise(async (resolve, reject) => {
			if(this.is_flatpak && executable_path !== 'flatpak-spawn') {
				return resolve(await this.runProcess('flatpak-spawn', ['--host'].concat(executable_path, ...args)));
			}

			const process = spawn(executable_path, args);

			process.stdout.on('data', (data: string) => { outputs.stdout += data; });
			process.stderr.on('data', (data: string) => { outputs.stderr += data; });

			process.on('close', function(code: number) {
				if(code === 0) {
					resolve(outputs);
				}
				else {
					reject('Nonzero exitcode.\nSTDERR: ' + outputs.stderr
                        + '\nSTDOUT: ' + outputs.stdout);
				}
			});

			process.on('exit', function(code: number) {
				process.emit('close', code);
			});

			process.on('error', function(err: string) {
				reject(err);
			});
		});
	}

	async callReSnap(landscape: boolean) {
		const { reSnapPath, rmAddress } = this.settings;

		const adapter = this.app.vault.adapter;

		if (!(adapter instanceof FileSystemAdapter)) {
			return void new Notice('Could not get vault path! Is this running on mobile...?');
		}

		const now = moment();
		const drawingFileName = `rM drawing ${now.format('YYYY-MM-DD-HH.mm.ss')}.png`;

		const absOutputFolderPath = adapter.getFullPath(this.settings.outputPath);
		const drawingFilePath = path.join(absOutputFolderPath, drawingFileName);

		let args = ['-o', drawingFilePath, '-s', rmAddress, '-n'];

		if(landscape) {
			args = args.concat(['-l']);
		}

		await this.runProcess(reSnapPath, args);

		return { drawingFilePath, drawingFileName };
	}

	async postprocessDrawing(drawingFilePath: string) {
		const { custom_postprocessor } = this.settings;

		const args = [drawingFilePath];
		// get plugin path and append postprocess.py
		const postprocessor_path = custom_postprocessor == '' ? path.join((this.app.vault.adapter as DataAdapter&{basePath: string}).basePath, '.obsidian', 'plugins', this.manifest.id, 'postprocess.py') : custom_postprocessor;

		if(custom_postprocessor == '') {
			// check if venv directory exits
			const venv_path = path.join((this.app.vault.adapter as DataAdapter&{basePath: string}).basePath, '.obsidian', 'plugins', this.manifest.id, 'venv');

			if(!fs.existsSync(venv_path)) {
				new Notice('Installing postprocessor dependencies', 2000);
				const { stderr } = await this.runProcess('python3', ['-m', 'venv', venv_path]);
				if(stderr != '') {
					fs.rmSync(venv_path, { force: true, recursive: true });
					return new Notice('Could not create postprocessor venv!');
				}
				const { stderr: err } = await this.runProcess(path.join(venv_path, 'bin', 'python'), ['-m', 'pip', 'install', 'pillow', 'numpy']);
				if(err != '') {
					fs.rmSync(venv_path, { force: true, recursive: true });
					return new Notice('Could not install postprocessor dependencies!');
				}
			}
		}

		await this.runProcess(postprocessor_path, args);
	}
	// #endregion

	async tryInsertingDrawing(landscape: boolean) {
		new Notice('Inserting rM drawing...', 2000);
		try {
			const result = await this.callReSnap(landscape);

			if(!result) {
				return;
			}

			const { drawingFilePath, drawingFileName } = result;

			if (this.settings.postprocessor) {
				await this.postprocessDrawing(drawingFilePath);
			}

			if(!this.editor) throw new Error('Could not get editor!');

			this.editor.replaceRange(`![[${drawingFileName}]]`, this.editor.getCursor());

			new Notice('Inserted your rM drawing!');
		}
		catch(error) {
			new Notice('Could not insert your rM drawing! Is your tablet connected and reachable at the configured address?');
		}
	}

	/* Taken and adapted from hans/obsidian-citation-plugin. Cheers! */
	get editor(): Editor|null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);

		try {
			if (view && view.getMode() === 'source') {
				return view.editor;
			}
			else {
				return null;
			}
		}
		catch (error) {
			return null;
		}
	}

	/* Taken from hans/obsidian-citation-plugin. Cheers! */
	resolveLibraryPath(rawPath: string): string {
		const vaultRoot =
            this.app.vault.adapter instanceof FileSystemAdapter
            	? this.app.vault.adapter.getBasePath()
            	: '/';

		return path.resolve(vaultRoot, rawPath);
	}
}