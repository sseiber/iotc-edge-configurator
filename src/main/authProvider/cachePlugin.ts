import store, { StoreKeys } from '../store';
import logger from '../logger';
import { join as pathJoin } from 'path';
import * as fse from 'fs-extra';
import { TokenCacheContext } from '@azure/msal-node';

const ModuleName = 'cachePlugin';

const beforeCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
    logger.log([ModuleName, 'info'], `beforeCacheAccess`);

    const tokenCachePathname = pathJoin(store.get(StoreKeys.tokenCachePath), store.get(StoreKeys.tokenCacheName));

    logger.log([ModuleName, 'info'], `checking dir: ${store.get(StoreKeys.tokenCachePath)}`);
    logger.log([ModuleName, 'info'], `reading file: ${tokenCachePathname}`);

    if (fse.pathExistsSync(tokenCachePathname)) {
        const data = await fse.readFile(tokenCachePathname, 'utf-8');

        cacheContext.tokenCache.deserialize(data);
    }
    else {
        fse.ensureDirSync(store.get(StoreKeys.tokenCachePath));
        await fse.writeFile(tokenCachePathname, cacheContext.tokenCache.serialize());
    }
};

const afterCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
    logger.log([ModuleName, 'info'], `afterCacheAccess`);

    if (cacheContext.cacheHasChanged) {
        await fse.writeFile(pathJoin(store.get(StoreKeys.tokenCachePath), store.get(StoreKeys.tokenCacheName)), cacheContext.tokenCache.serialize());
    }
};

export const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
};
