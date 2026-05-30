import { type FastifyInstance, type FastifyPluginOptions, type FastifyRequest, type FastifyReply } from "fastify"
import { createUsuarioController } from "./controllers/createUsuarioController.js"
import { deleteUsuarioController } from "./controllers/deleteUsuarioController.js"
import { createImagemController } from "./controllers/createImagemController.js"
import { deleteImagemController } from "./controllers/deleteImagemController.js"
import { listImagemController } from "./controllers/listImagemController.js"

export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) { 
    
    fastify.get("/teste", async (request: FastifyRequest, reply: FastifyReply) => {//rota de teste para ver se o servidor esta rodando
        return {ok : true}
    })

    fastify.post("/usuario", async (request: FastifyRequest, reply: FastifyReply) => { //rota para criar o usuario
        return new createUsuarioController().handle(request, reply) 
    })

    
    fastify.delete("/usuario", async (request: FastifyRequest, reply: FastifyReply) => { //rota para deletar o usuario
        return new deleteUsuarioController().handle(request, reply) 
    })

    fastify.post("/imagem", async (request: FastifyRequest, reply: FastifyReply) => { //rota para adicionar uma imagem
        return new createImagemController().handle(request, reply) 
    })

    fastify.delete("/imagem", async (request: FastifyRequest, reply: FastifyReply) => { //rota para deletar uma imagem
        return new deleteImagemController().handle(request, reply) 
    })

    fastify.get("/imagem", async (request: FastifyRequest, reply: FastifyReply) => { //rota para listar imagens
        return new listImagemController().handle(request, reply) 
    })
}