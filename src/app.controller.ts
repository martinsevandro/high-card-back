import { Controller, Get, Post, HttpException, HttpStatus  } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  getHello(): string {
    return 'API rodando com sucesso!';
  }

  @Get('db-check')
  async checkDB() {
    if (!this.connection || !this.connection.db) {
      return {
        status: 'Falha na conexão',
        error: 'Database connection not established'
      };
    }

    try {
      const collections = await this.connection.db.listCollections().toArray();
      return {
        status: 'Conectado',
        dbName: this.connection.name,
        collections: collections.map(col => col.name)
      };
    } catch (error) {
      return {
        status: 'Erro na consulta',
        error: error.message
      };
    }
  }

  @Post('create-test-collection')
  async createTestCollection() {
    if (this.connection.readyState !== 1) {
      throw new HttpException('Banco de dados não conectado', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const db = this.connection.db;
      if (!db) {
        throw new HttpException('Banco de dados não disponível', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      await db.collection('test_cards').insertOne({
        name: 'Card de Teste',
        createdAt: new Date(),
      });
      return { message: 'Coleção criada com sucesso!' };
    } catch (error) {
      throw new HttpException(`Erro ao criar coleção: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  

}
