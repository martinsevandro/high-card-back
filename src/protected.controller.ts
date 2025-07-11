import { Controller, Get, UseGuards, Request} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('protected')
export class ProtectedController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getProtected(@Request() req: ExpressRequest) {
    return {
      message: 'Acesso autorizado à rota protegida',
      user: req.user,
    };
  }
}
