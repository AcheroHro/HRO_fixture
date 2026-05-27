# Security Specification

## Data Invariants
1. A user can only read and write their own predictions.
2. The user profile can only be read and updated by the user themselves.
3. The official results can only be read by anyone, but updated only by an admin.
4. Admins can read all predictions (if ranking is central, though it's client-side, we may need to allow reads of predictions to everyone or just authenticated users for the leaderboard). Wait, the leaderboard needs to display all users' scores. Thus, `users` and `predictions` must be readable by any authenticated user for score calculations!
Let me refine invariants:
1. `predictions/{userId}` can be read by any authenticated user (needed for leaderboard), but created/updated only by the owner (`request.auth.uid == userId`).
2. `users/{userId}` can be read by any authenticated user, but created/updated only by the owner (`request.auth.uid == userId`).
3. `results/official` can be read by any authenticated user, and can only be updated by admins (`isValidAdmin(request.auth.uid)`).
4. `admins/{userId}` can be read by the owner to check if they are an admin, and by no one else to modify (read-only for system).

## The Dirty Dozen Payloads
1. Unauthenticated reading of users.
2. Unauthenticated reading of predictions.
3. User updating another user's profile.
4. User updating another user's predictions.
5. User updating results/official.
6. Admin updating results/official with invalid payload limit (e.g. results not being a map).
7. User setting their profile with additional unauthorized fields.
8. User creating prediction document with a string instead of map.
9. Missing required field in prediction creation.
10. Injecting massive payload into the predictions map.
11. Injecting massive string to document ID.
12. Unauthenticated updating of results.
