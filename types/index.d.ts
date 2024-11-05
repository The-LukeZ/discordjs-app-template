declare global {
    interface CommandFile {
        data?: SlashCommandBuilder;
        run?: Function;
        autocomplete?: Function;
        [key: string]: any;
    }

    interface ComponentFile {
        prefix?: SlashCommandBuilder;
        run?: Function;
        [key: string]: any;
    }
}
