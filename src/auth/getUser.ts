import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";



export interface GetUserRequest {
    providerMethod: 'google' | 'microsoft' | 'github' | 'facebook',
    providerPayload: string,
}

export interface GetUserResponse {
    status_code: number,
    message: string,
    user: Omit<User, 'password'> | null
}


export async function getUser(
    call: ServerUnaryCall<GetUserRequest, GetUserResponse>,
    callback: sendUnaryData<GetUserResponse>
) {
    const { providerMethod, providerPayload } = call.request;

    if (providerMethod !== 'google' && providerMethod !== 'microsoft' && providerMethod !== 'github' && providerMethod !== 'facebook') {
        return callback(null, {
            status_code: 400,
            message: "Bad request",
            user: null
        })
    }

    if (!providerMethod || !providerPayload) {
        return callback(null, {
            status_code: 400,
            message: "Bad request",
            user: null
        });
    }

    const query: {
        googleProviderId?: string,
        microsoftProviderId?: string,
        githubProviderId?: string,
        facebookProviderId?: string,
    } = {}
    if (providerMethod === 'google') {
        query.googleProviderId = providerPayload
    }

    if (providerMethod === 'microsoft') {
        query.microsoftProviderId = providerPayload
    }

    if (providerMethod === 'github') {
        query.githubProviderId = providerPayload
    }

    if (providerMethod === 'facebook') {
        query.facebookProviderId = providerPayload
    }



    try {
        const user = await prisma.user.findFirst({
            where: query
        })


        if (!user) {
            return callback(null, {
                status_code: 404,
                message: "User not found",
                user: null
            });
        }

        console.log('User found:', user);


        return callback(null, {
            status_code: 200,
            message: "User found",
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                googleProviderId: user.googleProviderId,
                microsoftProviderId: user.microsoftProviderId,
                githubProviderId: user.githubProviderId,
                facebookProviderId: user.facebookProviderId,
                isVerified: user.isVerified,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });

    } catch (error) {
        return callback(null, {
            status_code: 500,
            message: "Internal server error",
            user: null
        });

    }

}