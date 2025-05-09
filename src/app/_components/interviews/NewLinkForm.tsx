import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

// Define a more specific type to avoid "any" errors
type ToastType = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const typedToast = toast as unknown as ToastType;

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  interviewName: z.string().min(1, {
    message: "Interview name is required",
  }),
  expiryDate: z.date().optional(),
  rowQuota: z.coerce.number().int().positive().optional(),
});

export function NewLinkForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLink = api.interviewLink.createInterviewLink.useMutation({
    onSuccess: () => {
      typedToast.success("Interview link created successfully");
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      typedToast.error(`Failed to create interview link: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      interviewName: "",
      rowQuota: 5,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    createLink.mutate({
      projectId,
      name: values.name,
      interviewName: values.interviewName,
      expiryDate: values.expiryDate,
      rowQuota: values.rowQuota,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Expert evaluation round 1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for this interview link (for your reference
                only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interviewName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Recipient</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Alex" {...field} />
              </FormControl>
              <FormDescription>
                The name of the person who will be taking this interview
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiry Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The link will expire after this date
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rowQuota"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Quota (Optional)</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormDescription>
                Maximum number of questions to present in this interview
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Generate Interview Link"}
        </Button>
      </form>
    </Form>
  );
}
