export function createSelectOptionsFromEnum(enumObject: any): any[] {
    const length = Object.keys(enumObject).length / 2;

    const options = [];
    let index = 0;

    // eslint-disable-next-line guard-for-in
    for (const prop in enumObject) {
        if (index >= length) {
            break;
        }

        options.push(
            {
                key: enumObject[enumObject[prop]],
                text: enumObject[prop],
                value: enumObject[enumObject[prop]]
            }
        );

        ++index;
    }

    return options;
}
