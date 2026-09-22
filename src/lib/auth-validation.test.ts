import { describe, expect, it } from "vitest";
import {
    safeReturnPath,
    validateEmail,
    validateLogIn,
    validatePassword,
    validateSignUp,
} from "./auth-validation";

describe("validateEmail", () => {
    it("rejects empty and malformed", () => {
        expect(validateEmail("")).toBeDefined();
        expect(validateEmail("   ")).toBeDefined();
        expect(validateEmail("nope")).toBeDefined();
        expect(validateEmail("a@b")).toBeDefined();
        expect(validateEmail("a b@c.com")).toBeDefined();
    });
    it("accepts a normal address, ignoring surrounding whitespace", () => {
        expect(validateEmail("  chris@example.com ")).toBeUndefined();
    });
});

describe("validatePassword", () => {
    it("requires 8+ characters", () => {
        expect(validatePassword("")).toBeDefined();
        expect(validatePassword("1234567")).toBeDefined();
        expect(validatePassword("12345678")).toBeUndefined();
    });
});

describe("validateSignUp", () => {
    it("returns no errors for a valid submission", () => {
        expect(
            validateSignUp({
                email: "a@b.co",
                password: "longenough",
                confirmPassword: "longenough",
            }),
        ).toEqual({});
    });
    it("flags mismatched confirmation only when the password itself is valid", () => {
        expect(
            validateSignUp({
                email: "a@b.co",
                password: "longenough",
                confirmPassword: "different",
            }),
        ).toEqual({ confirmPassword: "Passwords don't match." });
        expect(
            validateSignUp({
                email: "a@b.co",
                password: "short",
                confirmPassword: "different",
            }),
        ).toEqual({ password: "Use at least 8 characters." });
    });
    it("reports every failing field at once", () => {
        const errors = validateSignUp({
            email: "",
            password: "",
            confirmPassword: "",
        });
        expect(Object.keys(errors).sort()).toEqual(["email", "password"]);
    });
});

describe("validateLogIn", () => {
    it("only checks presence of the password", () => {
        expect(validateLogIn({ email: "a@b.co", password: "x" })).toEqual({});
        expect(validateLogIn({ email: "a@b.co", password: "" })).toEqual({
            password: "Enter your password.",
        });
    });
});

describe("safeReturnPath", () => {
    it("keeps same-origin relative paths", () => {
        expect(safeReturnPath("/account")).toBe("/account");
        expect(safeReturnPath("/read/john/3#verse-16")).toBe(
            "/read/john/3#verse-16",
        );
    });
    it("falls back on open-redirect attempts and junk", () => {
        expect(safeReturnPath("https://evil.example")).toBe("/reader");
        expect(safeReturnPath("//evil.example")).toBe("/reader");
        expect(safeReturnPath("/\\evil.example")).toBe("/reader");
        expect(safeReturnPath("/ok\r\nLocation: x")).toBe("/reader");
        expect(safeReturnPath(null)).toBe("/reader");
        expect(safeReturnPath(undefined, "/x")).toBe("/x");
    });
});
