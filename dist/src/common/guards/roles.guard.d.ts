import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const ROLES_KEY = "roles";
export type UserRole = 'owner' | 'candidato' | 'coord_general' | 'coord_zona' | 'brigadista' | 'cm';
export declare class RolesGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare const Roles: (...roles: UserRole[]) => (target: any, key?: string, descriptor?: PropertyDescriptor) => void;
