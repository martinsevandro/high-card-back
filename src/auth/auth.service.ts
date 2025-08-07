import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
   constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
   ) {}

   async register(username: string, password: string) {
      const existing = await this.usersService.findByUsername(username);
      if (existing) {
         throw new Error('Usuário já existe');
      }

      const newUser = await this.usersService.create({ username, password });

      const payload = { sub: newUser._id, username: newUser.username };
      const token = this.jwtService.sign(payload); 

      return {
         access_token: token,
         user: { id: newUser._id, username: newUser.username },
         message: 'Usuário criado com sucesso', 
      };

      // return { message: 'Usuário criado com sucesso', id: newUser._id };
   }

   async login(username: string, password: string) {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
         throw new UnauthorizedException('Usuário não encontrado');
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
         throw new UnauthorizedException('Senha inválida');
      }

      const payload = { sub: user._id, username: user.username };
      const token = this.jwtService.sign(payload);

      return {
         access_token: token,
         user: { id: user._id, username: user.username },
      };
   }
}
