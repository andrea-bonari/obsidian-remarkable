export interface RemarkablePluginSettings {
	reSnapPath: string;
	outputPath: string;
	rmAddress: string;
	invertRemarkableImages: boolean;
	postprocessor: boolean;
	custom_postprocessor: string;
};

export const DEFAULT_SETTINGS: RemarkablePluginSettings = {
	reSnapPath: '',
	outputPath: '.',
	rmAddress: '10.11.99.1',
	invertRemarkableImages: true,
	postprocessor: true,
	custom_postprocessor: '',
};