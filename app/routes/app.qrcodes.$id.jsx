import { useState } from "react";
//@deprecated
// This utility is deprecated in favor of opting into Single Fetch via
// future.v3_singleFetch and returning raw objects. This method will be removed in React Router v7.
//  If you need to return a JSON Response, you can use Response.json().
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Bleed,
  Button,
  ChoiceList,
  Divider,
  EmptyState,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import db from "../db.server";
import { getQRCode, validateQRCode } from "../models/QRCode.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  if (params.id === "new") {
    return json({ destination: "product", title: "" });
    // return Response.json
  }
  return json(await getQRCode(Number(params.id), admin.graphql));
}
export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };
  if (data.action === "delete") {
    await db.qRCode.delete({
      where: {
        id: Number(params.id),
      },
    });
    return redirect("/app");
  }
  const errors = validateQRCode(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }
  const qrCode =
    params.id === "new"
      ? await db.qRCode.create({ data })
      : await db.qRCode.update({ where: { id: Number(params.id) }, data });
  return redirect(`/app/qrcodes/${qrCode.id}`);
}
export default function QRCodeForm() {
  const errors = useActionData()?.errors || {};
  const qrCode = useLoaderData();
  const [formState, setFormState] = useState(qrCode);
  const [cleanFormState, setCleanFormState] = useState(qrCode);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";
  const navigate = useNavigate();
}
