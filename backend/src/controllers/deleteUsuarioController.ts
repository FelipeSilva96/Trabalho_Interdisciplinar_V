import {type FastifyRequest, type FastifyReply} from "fastify";
import { deleteUsuarioService } from "../services/deleteUsuarioService.js";

class deleteUsuarioController {
    async handle (request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.query as {id: string};

        const usuarioService = new deleteUsuarioService()
        const usuario = await usuarioService.execute({id});

        reply.send(usuario);
    }
}

export {deleteUsuarioController}