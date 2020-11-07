import { Router, Request, Response } from "express";
import { validateObject, Base, ObjectValidateDefinition } from "@nexcodepl/type-checking";

import {
    EndpointDefinition,
    EndpointDefinitionGetResponse,
    EndpointDefinitionGetData,
    EndpointDefinitionGetParams,
} from "@nexcodepl/endpoint-types";

interface EndpointAPIEndpointResponseNotSentSuccess<
    TEndpointDefinition extends EndpointDefinition<any, any, any, boolean>
> {
    responseSent?: false;
    error?: false;
    response: EndpointDefinitionGetResponse<TEndpointDefinition>;
    code?: undefined;
    errorMessage?: undefined;
    errorCode?: undefined;
    errorData?: undefined;
}

interface EndpointAPIEndpointResponseNotSentError {
    responseSent?: false;
    error: true;
    response?: undefined;
    code: number;
    errorMessage: string;
    errorCode: string;
    errorData?: any;
}

interface EndpointAPIEndpointResponseSent {
    responseSent: true;
    error?: undefined;
    response?: undefined;
    code?: undefined;
    errorMessage?: undefined;
    errorCode?: undefined;
    errorData?: undefined;
}

type EndpointAPIEndpointResponse<TEndpointDefinition extends EndpointDefinition<any, any, any, boolean>> =
    | EndpointAPIEndpointResponseNotSentSuccess<TEndpointDefinition>
    | EndpointAPIEndpointResponseNotSentError
    | EndpointAPIEndpointResponseSent;

type ValidateDefinitionOrUndefined<T> = T extends Base<T> ? ObjectValidateDefinition<T> : undefined;

export function EndpointAPI<TEndpointDefinition extends EndpointDefinition<any, any, any, boolean>>(
    router: Router,
    endpointDefinition: TEndpointDefinition,
    endpoint: (
        req: Request,
        res: Response,
        params?: EndpointDefinitionGetParams<TEndpointDefinition>,
        data?: EndpointDefinitionGetData<TEndpointDefinition>
    ) => Promise<EndpointAPIEndpointResponse<TEndpointDefinition>>,
    validateParams?: ObjectValidateDefinition<EndpointDefinitionGetParams<TEndpointDefinition>>,
    validateData?: ObjectValidateDefinition<EndpointDefinitionGetData<TEndpointDefinition>>
): void {
    const endpointFunction = async (req: Request, res: Response) => {
        const validationResultParams = validateParams
            ? validateObject(req.query as EndpointDefinitionGetParams<TEndpointDefinition>, validateParams)
            : { isValid: true, errors: [] };

        const validationResultData = validateData
            ? validateObject(req.body as EndpointDefinitionGetData<TEndpointDefinition>, validateData)
            : { isValid: true, errors: [] };

        if (!validationResultData.isValid && !validationResultParams.isValid) {
            res.send({
                errorMessage: `Invalid Data and Params.`,
                errorCode: "InvalidDataAndParams",
                errorData: {
                    dataErrors: validationResultData.errors,
                    paramsErrors: validationResultParams.errors,
                },
            });
        } else if (!validationResultData.isValid) {
            res.send({
                errorMessage: `Invalid Data.`,
                errorCode: "InvalidData",
                errorData: {
                    dataErrors: validationResultData.errors,
                },
            });
        } else if (!validationResultParams.isValid) {
            res.send({
                errorMessage: `Invalid Params.`,
                errorCode: "InvalidParams",
                errorData: {
                    paramsErrors: validationResultParams.errors,
                },
            });
        } else {
            const response = await endpoint(
                req,
                res,
                req.query as EndpointDefinitionGetParams<TEndpointDefinition>,
                req.body as EndpointDefinitionGetData<TEndpointDefinition>
            );
            if (!response.responseSent) {
                if (!response.error) {
                    res.send(response.response);
                } else if (response.error) {
                    res.statusCode = response.code;
                    res.send({
                        errorMessage: response.errorMessage,
                        errorCode: response.errorCode,
                        errorData: response.errorData,
                    });
                }
            }
        }
    };

    if (endpointDefinition.method === "GET") {
        router.get(endpointDefinition.url, endpointFunction);
    } else if (endpointDefinition.method === "POST") {
        router.post(endpointDefinition.url, endpointFunction);
    } else {
        throw new Error("InvalidEndpointDefinitionMethod");
    }
}
