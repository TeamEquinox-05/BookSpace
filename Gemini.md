Best Approach (Required Changes):

Authentication Flow

On login/signup, backend issues a JWT with role embedded.

JWT is stored in a secure, httpOnly cookie (not accessible by JS).

On app load/refresh, frontend calls /api/users/me, backend verifies JWT, and returns { id, name, role }.

Save user details in React AuthContext.

Frontend Role Handling

Create an AuthContext to hold user state ({ name, role }).

Provide login(), logout(), refreshUser() functions inside context.

Use user.role from context for conditional rendering (e.g., show AdminDashboard only if role === "admin").

Remove localStorage usage completely for role or user info.

Backend Role Enforcement

Add Express middleware to verify JWT and check role.

Protect admin routes with role checks (verifyRole(["admin"])).

Example: /admin/venues accessible only if user role = admin.

Logout

Frontend calls /api/auth/logout.

Backend clears cookie.

AuthContext resets user = null.

Goal:
Make authentication and role-based access secure, scalable, and centralized: frontend only displays role from AuthContext, backend enforces role authorization.