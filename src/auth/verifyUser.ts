import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import {prisma} from "../lib/prisma";
import { redisClient } from "../lib/redis";
import { CreateUserResponse } from "./createUser";


export interface VerifyUserRequest {
    email: string,
    token: string,
}


export interface VerifyUserResponse extends CreateUserResponse { }

export async function verifyUser(
    call: ServerUnaryCall<VerifyUserRequest, VerifyUserResponse>,
    callback: sendUnaryData<VerifyUserResponse>
) {

    const { email, token } = call.request;
    try {

        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })

        const currentToken = await redisClient.get(email);

        if (currentToken !== token) {
            return callback(null, {
                status_code: 400,
                message: "Invalid token"
            });
        }

        if (user && user.isVerified) {
            return callback(null, {
                status_code: 409,
                message: "User already verified"
            });
        }

        await prisma.user.update({
            where: {
                email: email,
                isVerified: false
            },
            data: {
                isVerified: true
            }
        })

        callback(null, {
            status_code: 200,
            message: "User verified successfully"
        });

    } catch (error) {

        console.error('Internal Log Error verifying user:', error);


        if (error.code === 'P2025') {
            return callback(null, {
                status_code: 404,
                message: "User not found"
            });
        }


        return callback(null, {
            status_code: 500,
            message: "Internal server error"
        });

    }


}
