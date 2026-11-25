import sdk from '../../package.json'

/**
 * The SDK's version (`ui/sdk/package.json`), built into Atrium's front end.
 * Its major.minor must equal Atrium's API version (`Atrium::API_VERSION`);
 * the version banner warns when the shell's `api_version` differs.
 */
export const ATRIUM_SDK_VERSION: string = sdk.version
