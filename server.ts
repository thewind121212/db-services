import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createFileHandle, getAllFilesHandle, getFileDetailHandle, deleteFileHandle } from './src/file-manager/services';
import { redisClient } from './src/lib/redis';
import { createUser } from './src/auth/createUser';
import { verifyUser } from './src/auth/verifyUser';
import { resendVerifyEmail } from './src/auth/resendVerify';
import { checkHealthFn } from './src/health-check/services';
import { getUser } from './src/auth/getUser';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Load the .proto file
const __dirname = path.resolve();
const PROTO_PATH = path.join(__dirname, 'db.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDefinition) as any;



// Set up the gRPC server
const server = new grpc.Server();
server.addService(proto.filemanager.FileService.service, { CreateFile: createFileHandle, GetAllFiles: getAllFilesHandle, GetFile: getFileDetailHandle, DeleteFile: deleteFileHandle });
server.addService(proto.filemanager.HealthCheck.service, { Ping: checkHealthFn });
server.addService(proto.filemanager.AuthService.service, { CreateUser: createUser, VerifyUser: verifyUser, ResendVerificationEmail: resendVerifyEmail, GetUser: getUser });

// Start the server
const port = '0.0.0.0:50051';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), () => {
    redisClient.on('connect', () => {
        console.log('Connected to Redis');
    });

    redisClient.on('error', (err) => {
        console.error('Redis error:', err);
    });
    console.log(`Server grpc running on ${port}`);
});


