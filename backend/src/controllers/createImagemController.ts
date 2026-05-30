import {type FastifyRequest, type FastifyReply} from "fastify";
import { createImagemService } from "../services/createImagemService.js";
import type { Bytes } from "@prisma/client/runtime/library";


class createImagemController {
    async handle (request: FastifyRequest, reply: FastifyReply) {
        const {dados, usuarioId} = request.body as {dados:Bytes, usuarioId:string}

        const imagemService = new createImagemService()
        const usuario = await imagemService.execute({dados, usuarioId});

        reply.send(usuario);
    }
}

export {createImagemController}