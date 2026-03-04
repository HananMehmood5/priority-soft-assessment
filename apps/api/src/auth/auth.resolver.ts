import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@shiftsync/shared';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => String, { nullable: true })
  async login(
    @Args('input') input: LoginInput,
  ): Promise<string | null> {
    const user = await this.authService.validateUser(input.email, input.password);
    if (!user) return null;
    const { accessToken } = await this.authService.login(user);
    return accessToken;
  }

  /** Only Admin can create new user accounts (register). */
  @Mutation(() => UserEntity)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async register(@Args('input') input: RegisterInput): Promise<UserEntity> {
    const user = await this.authService.register({
      email: input.email,
      password: input.password,
      role: input.role,
      name: input.name,
    });
    return user as unknown as UserEntity;
  }
}
