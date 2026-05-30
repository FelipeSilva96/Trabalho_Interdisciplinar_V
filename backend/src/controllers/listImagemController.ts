import {type FastifyRequest, type FastifyReply} from "fastify";
import { listImagemService } from "../services/listImagemService.js";

class listImagemController {
    async handle (request: FastifyRequest, reply: FastifyReply) {
        const {usuarioId} = request.body as {usuarioId: string}

        const imagemService = new listImagemService()
        const imagem = imagemService.execute({usuarioId})

        reply.send(imagem)
    }
}

export { listImagemController }