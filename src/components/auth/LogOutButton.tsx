import { logOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function LogOutButton() {
    return (
        <form action={logOut}>
            <Button type="submit" variant="secondary" size="sm">
                Log out
            </Button>
        </form>
    );
}
