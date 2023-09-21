import RemarkablePlugin from 'main';
import { PluginSettingTab, App, FileSystemAdapter, Setting } from 'obsidian';

export class RemarkableSettingTab extends PluginSettingTab {
	plugin: RemarkablePlugin;

	outputPathInfo: HTMLElement;
	outputPathError: HTMLElement;
	outputPathSuccess: HTMLElement;

	constructor(app: App, plugin: RemarkablePlugin) {
		super(app, plugin);
		this.plugin = plugin;

		this.containerEl.empty();
		this.containerEl.createEl('h2', { text: 'Obsidian & reMarkable' });

		this.outputPathInfo = this.containerEl.createEl('p', {
			cls: 'remarkable-output-path-info d-none',
			text: 'Checking output folder...',
		});

		this.outputPathError = this.containerEl.createEl('p', {
			cls: 'remarkable-output-path-error d-none',
			text: 'The output folder does not seem to exist. Please type in a path to a folder that exists inside the vault.',
		});

		this.outputPathSuccess = this.containerEl.createEl('p', {
			cls: 'remarkable-output-path-success d-none',
			text: 'Successfully set the output folder.',
		});

		this.outputPathInfo.style.display = 'none';
		this.outputPathError.style.display = 'none';
		this.outputPathSuccess.style.display = 'none';
	}

	async checkOutputFolder(outputFolder: string): Promise<boolean> {
		this.outputPathInfo.addClass('d-none');

		try {
			const adapter = this.app.vault.adapter;

			if (adapter instanceof FileSystemAdapter) {
				const resolvedPath = outputFolder;
				const stat = await adapter.stat(resolvedPath);

				if(stat && stat.type !== 'folder') throw new Error('Chosen output folder is not a folder!');
			}
			else {
				throw new Error('Could not get FileSystemAdapter! Is this running on mobile...?');
			}
		}
		catch (e) {
			this.outputPathSuccess.style.display = 'none';
			this.outputPathError.style.display = 'block';
			return false;
		}
		finally {
			this.outputPathInfo.style.display = 'none';
		}

		return true;
	}

	display(): void {
		new Setting(this.containerEl)
			.setName('reMarkable IP')
			.setDesc('The IP address of your reMarkable. Use 10.11.99.1 and connect via cable if unsure.')
			.addText(text => text
				.setPlaceholder('Example: 10.11.99.1')
				.setValue(this.plugin.settings.rmAddress)
				.onChange(async (value) => {
					this.plugin.settings.rmAddress = value;
					await this.plugin.saveSettings();
				}));

		new Setting(this.containerEl)
			.setName('reSnap executable')
			.setDesc('The path to the reSnap executable')
			.addText(text => text
				.setPlaceholder('Paste in the absolute path to reSnap.sh')
				.setValue(this.plugin.settings.reSnapPath)
				.onChange(async (value) => {
					this.plugin.settings.reSnapPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(this.containerEl)
			.setName('Output folder')
			.setDesc('The folder where rM drawing images should be stored')
			.addText(text => text
				.setPlaceholder('Some folder from your Vault')
				.setValue(this.plugin.settings.outputPath)
				.onChange(async (value) => {
					const success = await this.checkOutputFolder(value);

					if(success) {
						this.plugin.settings.outputPath = value;

						await this.plugin.saveSettings();

						this.outputPathError.style.display = 'none';
						this.outputPathSuccess.style.display = 'block';
					}
				}));

		new Setting(this.containerEl)
			.setName('Enable postprocessing')
			.setDesc('Enable postprocessing of the captured image. ' +
                'This will run a script to remove the background and crop the image.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.postprocessor)
				.onChange(async (value) => {
					this.plugin.settings.postprocessor = value;
					await this.plugin.saveSettings();
				}));


		new Setting(this.containerEl)
			.setName('Custom postprocessing script')
			.setDesc('The absolute path to a script that post-processes the captured image. ' +
                'The script will be passed the filename and should overwrite the file with a modified version.')
			.addText(text => text
				.setPlaceholder('default')
				.setValue(this.plugin.settings.custom_postprocessor)
				.onChange(async (value) => {
					this.plugin.settings.custom_postprocessor = value;
					await this.plugin.saveSettings();
				}));
	}
}