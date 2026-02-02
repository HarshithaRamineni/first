// Firebase Authentication - No server routes needed
// Firebase Auth is handled entirely client-side with popup/redirect flows
// Server verification is done via firebase-admin verifyIdToken

export async function GET() {
    return Response.json({ message: "Firebase Auth - client-side only" });
}
