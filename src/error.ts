export interface ErrorDataBase {
    code: number;
    errorMessage: string;
    errorCode: string;
    errorData?: any;
}

export interface ErrorData extends ErrorDataBase {
    error: true;
}

export interface ErrorCase {
    matchObject: { [key: string]: string | number };
    handler: (error: any) => ErrorDataBase;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function EndpointError(error: any, errorCases?: ErrorCase[]): ErrorData {
    if (!errorCases) errorCases = [];

    for (let i = 0; i < errorCases.length; i++) {
        const errorCase = errorCases[i];
        const matchObjectKeys = Object.keys(errorCase.matchObject);

        if (
            matchObjectKeys.reduce((result, matchObjectKey) => {
                if (!result) return result;

                if (
                    !!error &&
                    !!error[matchObjectKey] &&
                    error[matchObjectKey] === errorCase.matchObject[matchObjectKey]
                )
                    return result;

                return false;
            }, true)
        ) {
            return { error: true, ...errorCase.handler(error) };
        }
    }

    if (!!error && !!error.code && !!error.errorCode && !!error.errorMessage) {
        return {
            error: true,
            code: error.code,
            errorMessage: error.errorMessage,
            errorCode: error.errorCode,
        };
    }

    return {
        error: true,
        code: 500,
        errorCode: "UnknownError",
        errorMessage: "Wystąpił nieznany błąd",
    };
}
