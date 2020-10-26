import {
    AcceptableTypes,
    ArrayBasicType,
    Base,
    BasicType,
    ObjectValidateDefinition,
    ValidateObjectDefinitionObjectType,
    ValidateObjectError,
    ValidetObjectResponse,
} from "./validate.types";

export function validateObject<T extends Base<T>>(
    object: T,
    objectValidateDefinition: ObjectValidateDefinition<T>,
    parentObject?: string
): ValidetObjectResponse {
    const definitionKeys = Object.keys(objectValidateDefinition) as Array<keyof typeof objectValidateDefinition>;

    const validationErrors: ValidateObjectError[] = definitionKeys.reduce((errors, key) => {
        const fieldName = `${parentObject ? `${parentObject}.` : ""}${key}`;
        const definition = objectValidateDefinition[key];
        const definitionType = definition.type;

        if (!definition) {
            return errors;
        }

        const objectProp = object[key];

        if (objectProp) {
            switch (definitionType) {
                case "boolean":
                case "number":
                case "string":
                case "Date":
                    errors.push(...checkBasicType(fieldName, objectProp, definitionType));
                    break;

                case "DateArray":
                case "booleanArray":
                case "numberArray":
                case "stringArray":
                    if (Array.isArray(objectProp)) {
                        errors.push(
                            ...(objectProp as Array<AcceptableTypes>).reduce((arrayErrors, item, index) => {
                                arrayErrors.push(
                                    ...checkBasicType(
                                        `${fieldName}[${index}]`,
                                        item,
                                        arrayTypeToBasicType(definitionType)
                                    )
                                );
                                return arrayErrors;
                            }, [] as ValidateObjectError[])
                        );
                    } else {
                        errors.push({
                            field: fieldName,
                            errorCode: `NotOfType${capitalize(definition.type)}`,
                            errorMessage: `Field '${fieldName}' is not array.`,
                        });
                    }
                    break;

                case "object":
                    if (typeof objectProp === "object") {
                        errors.push(
                            ...validateObject(
                                objectProp,
                                (definition as ValidateObjectDefinitionObjectType).validate,
                                fieldName
                            ).errors
                        );
                    } else {
                        errors.push({
                            field: fieldName,
                            errorCode: "NotOfTypeObject",
                            errorMessage: `Field '${fieldName}' should be of type Object.`,
                        });
                    }
                    break;

                case "objectArray":
                    if (Array.isArray(objectProp)) {
                        errors.push(
                            ...(objectProp as Array<Base<any>>).reduce((arrayErrors, item, index) => {
                                arrayErrors.push(
                                    ...validateObject(
                                        item,
                                        (definition as ValidateObjectDefinitionObjectType).validate,
                                        `${fieldName}[${index}]`
                                    ).errors
                                );
                                return arrayErrors;
                            }, [] as ValidateObjectError[])
                        );
                    } else {
                        errors.push({
                            field: fieldName,
                            errorCode: `NotOfTypeObjectArray`,
                            errorMessage: `Field '${fieldName}' is not array.`,
                        });
                    }
                    break;
            }
        } else {
            if (!definition.optional) {
                errors.push({
                    field: fieldName,
                    errorCode: "IsRequired",
                    errorMessage: `Field '${fieldName}' is required.`,
                });
            }
        }

        return errors;
    }, [] as ValidateObjectError[]);

    return {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
    };
}

function arrayTypeToBasicType(arrayType: ArrayBasicType): BasicType {
    switch (arrayType) {
        case "DateArray":
            return "Date";

        case "booleanArray":
            return "boolean";

        case "numberArray":
            return "number";

        case "stringArray":
            return "string";
    }
}

function checkBasicType(fieldName: string, objectProp: any, type: BasicType): ValidateObjectError[] {
    switch (type) {
        case "string":
        case "number":
        case "boolean":
            if (typeof objectProp !== type) {
                return [
                    {
                        field: fieldName,
                        errorCode: `NotOfType${capitalize(type)}`,
                        errorMessage: `Field '${fieldName}' should be of type ${type}`,
                    },
                ];
            }
            return [];

        case "Date":
            if ((objectProp as Date).getTime && (objectProp as Date).getTime() !== (objectProp as Date).getTime()) {
                return [
                    {
                        field: fieldName,
                        errorCode: `NotOfTypeDate`,
                        errorMessage: `Field '${fieldName}' should be of type Date`,
                    },
                ];
            }
            return [];
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
