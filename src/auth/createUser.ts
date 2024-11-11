import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import {prisma} from "../lib/prisma";
import { redisClient } from "../lib/redis";


export interface CreateUserRequest {
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    googleProviderId?: string,
    microsoftProviderId?: string,
    githubProviderId?: string,
    facebookProviderId?: string,
    loginProvider?: string,
    token: string,
}

export interface CreateUserResponse {
    status_code: number;
    message: string;
}

export async function createUser(
    call: ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
    callback: sendUnaryData<CreateUserResponse>
) {
    const { firstName, lastName, username, email, googleProviderId, microsoftProviderId, githubProviderId, facebookProviderId ,loginProvider, password, token } = call.request;


    try {
        const isUserExist = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email: email
                    },
                    {
                        username: username
                    }
                ]
            }
        })


        if (isUserExist?.isVerified) {
            callback(null, {
                status_code: 409,
                message: "User already exist"
            });
            return
        }


        await redisClient.set(email, token, 'EX', 60 * 60 * 24);
        if (isUserExist && !isUserExist?.isVerified) {
            const user = await prisma.user.update({
                where: {
                    id: isUserExist?.id
                },
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    email: email,
                    password: password,
                    googleProviderId: googleProviderId,
                    microsoftProviderId: microsoftProviderId,
                    githubProviderId: githubProviderId,
                    facebookProviderId: facebookProviderId,
                    lastLogin: new Date(),
                },
            });

            callback(null, {
                status_code: 200,
                message: "User created successfully"
            });
        }

        if (!isUserExist) {
            const user = await prisma.user.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    email: email,
                    password: password,
                    googleProviderId: googleProviderId,
                    microsoftProviderId: microsoftProviderId,
                    githubProviderId: githubProviderId,
                    facebookProviderId: facebookProviderId,
                    lastLogin: new Date(),
                },
            });

            callback(null, {
                status_code: 200,
                message: "User created successfully"
            });

        }

    } catch (error) {
        console.error('Error creating user:', error);
        callback(null, {
            status_code: 500,
            message: "Internal server error"
        });
    }
}