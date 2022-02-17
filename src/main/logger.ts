import log from 'electron-log';

// turn off file logging (keep second default of console logging on)
log.transports.file.level = false;
log.transports.console.level = 'info';

// TBD: desired usage and output...
// logger([ModuleName, 'error'], `Error while creating streaming locator: ${ex.message}`);
// [2022-02-16T12:57:38-0800] INFO: [startup,info] ✅ Server started

export function logger(tags: string[], ...params: any[]): void {
    const checkTags = Array.isArray(tags) ? tags : [];

    if (checkTags.includes('debug')) {
        log.debug(params);
    }
    else if (checkTags.includes('error')) {
        log.error(params);
    }
    else if (checkTags.includes('warn')) {
        log.warn(params);
    }
    else {
        log.info(params);
    }
}
