"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";


const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(3),
    })
}

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })
    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (type === "sign-up") {
                const { name, email, password } = values;

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const result = await signUp({
                    uid: userCredential.user.uid,
                    name: name!, //will have to have a name, that's why the ! mark
                    email,
                    password,
                });

                if (!result?.success) {
                    toast.error(result?.message);
                    return;
                }

                toast.success("Account created successfully. Please sign in.");
                router.push("/sign-in");
            } else {
                const { email, password } = values;

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const idToken = await userCredential.user.getIdToken();
                if (!idToken) {
                    toast.error("Sign in Failed. Please try again.");
                    return;
                }

                await signIn({
                    email,
                    idToken,
                });

                toast.success("Signed in successfully.");
                router.push("/");
            }
        } catch (error) {
            console.log(error);
            toast.error(`There was an error: ${error}`);
        } finally {
            console.log(values);
        }
    }
    const isSignIn = type === 'sign-in';
    return (
        //overall form space container
        <div className="card-border lg:min-w-[566px]">
            {/* card container */}
            <div className="flex flex-col gap-6 card py-14 px-10">
                {/* logo container */}
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="" width={32} height={38} />
                    <h2 className="text-primary-100">
                        PrepWise
                    </h2>
                </div>
                <h3 className="flex flex-row justify-center py-2">
                    Practice Job Interviews with AI
                </h3>
                {/* form is inside the card container */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 form w-full">
                        {!isSignIn &&
                            <FormField control={form.control} name="name" label="Name" placeholder="Enter your Full Name" />
                        }
                        <FormField control={form.control} name="email" label="Email" placeholder="Enter your Email Address" />
                        <FormField control={form.control} type="password" name="password" label="Password" placeholder="Enter your Password" />
                        <Button className="btn mt-4" type="submit">
                            {
                                isSignIn ? "Sign In" : "Create an Account"
                            }
                        </Button>
                    </form>
                </Form>
                {/* switching link p tag below form*/}
                <p className="text-center">
                    {isSignIn ? 'No account yet?' : 'Have an account already?'}
                    <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1">
                        {!isSignIn ? 'Sign In' : 'Sign Up'}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default AuthForm
