export const validateFormat = (format: string) => {
    const validFormats = ["flac", "m4a", "opus", "mp3"];
    if (!validFormats.includes(format))
        throw new Error(
            `available formats are only: ${validFormats.join(", ")}`
        );
};
