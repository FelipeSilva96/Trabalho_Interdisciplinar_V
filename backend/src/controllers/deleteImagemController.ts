import {type FastifyRequest, type FastifyReply} from "fastify";
import { deleteImagemSerivce } from "../services/deleteImagemService.js";

class deleteImagemController {
    async handle (request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.body as {id: string}

        const imagemService = new deleteImagemSerivce()
        const imagem = imagemService.execute({id})

        reply.send(imagem)
    }
}

export {deleteImagemController}