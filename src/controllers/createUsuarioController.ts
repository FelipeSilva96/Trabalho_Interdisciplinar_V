import {type FastifyRequest, type FastifyReply} from "fastify";
import {createUsuarioService} from "../services/createUsuarioService.js"

class createUsuarioController {
    async handle (request: FastifyRequest, reply: FastifyReply){
        const {email, nome, senha } = request.body as {nome:string, email:string, senha:string};

        const usuarioService = new createUsuarioService()
        const usuario = await usuarioService.execute({email, nome, senha})

        reply.send(usuario)
    }
}

export { createUsuarioController }