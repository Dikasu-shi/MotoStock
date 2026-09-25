<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Ensure the authenticated user has one of the allowed roles.
     */
    protected function authorizeRoles(...$roles)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, $roles)) {
            abort(403, 'Akses ditolak. Anda tidak memiliki izin untuk mengakses fitur ini.');
        }
        return $user;
    }

    /**
     * Ensure the authenticated user is Admin.
     */
    protected function authorizeAdmin()
    {
        return $this->authorizeRoles('admin');
    }

    /**
     * Ensure the authenticated user is Admin or Kasir (internal staff).
     */
    protected function authorizeStaff()
    {
        return $this->authorizeRoles('admin', 'kasir');
    }
}