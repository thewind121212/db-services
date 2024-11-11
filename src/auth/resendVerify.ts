
import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import {prisma} from "../lib/prisma";
import { redisClient } from "../lib/redis";
import { CreateUserResponse } from "./createUser";


interface ResendVerifyEmailRequest {
    email: string,
    token: string,
}

interface ResendVerifyEmailResponse extends CreateUserResponse { }

export async function resendVerifyEmail(
    call: ServerUnaryCall<ResendVerifyEmailRequest, ResendVerifyEmailResponse>,
    callback: sendUnaryData<ResendVerifyEmailResponse>
) {


    try {
        const { email, token } = call.request;
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })

        if (!user) {
            return callback(null, {
                status_code: 404,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return callback(null, {
                status_code: 409,
                message: "User already verified"
            });
        }


        await redisClient.set(email, token, 'EX', 60 * 60 * 24);

        callback(null, {
            status_code: 200,
            message: "Email sent successfully"
        });

    } catch (error) {
        console.error('Internal Log Error verifying user:', error);
        return callback(null, {
            status_code: 500,
            message: "Internal server error"
        });
    }

}