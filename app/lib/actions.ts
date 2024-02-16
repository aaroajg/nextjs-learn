"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const InvoiceSchema = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = InvoiceSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to create invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

export const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = InvoiceSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status=${status} where id = ${id}
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to update invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

export const deleteInvoice = async (id: string) => {
  try {
    await sql`
    DELETE FROM invoices where id = ${id}
  `;
    revalidatePath("/dashboard/invoices");
  } catch (error) {
    return {
      message: "Database Error: Failed to delete invoice.",
    };
  }
};
