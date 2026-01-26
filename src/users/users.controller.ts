import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // GET /users - Admin list all users

    // PATCH /users/:id/disable - Admin disable user

    // GET /hosts - Guest list hosts

    // GET /hosts/:id - Guest view host detail
}
