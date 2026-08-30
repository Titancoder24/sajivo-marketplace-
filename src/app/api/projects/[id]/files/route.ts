import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "dwg"]);

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "File storage is not configured." },
      { status: 503 },
    );
  const [{ id: projectId }, { data: authData, error: authError }] =
    await Promise.all([params, supabase.auth.getUser()]);
  if (authError || !authData.user)
    return NextResponse.json(
      { error: "Sign in to view project files." },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("project_files")
    .select(
      "id, file_name, mime_type, file_size, storage_path, uploaded_by, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  const files = await Promise.all(
    (data ?? []).map(async (file) => {
      const { data: signed } = await supabase.storage
        .from("project-files")
        .createSignedUrl(file.storage_path, 900);
      return {
        ...file,
        storage_path: undefined,
        download_url: signed?.signedUrl ?? null,
      };
    }),
  );
  return NextResponse.json({ files });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "File storage is not configured." },
      { status: 503 },
    );

  const [{ id: projectId }, { data: authData, error: authError }] =
    await Promise.all([params, supabase.auth.getUser()]);
  if (authError || !authData.user)
    return NextResponse.json(
      { error: "Sign in to upload project files." },
      { status: 401 },
    );

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, customer_id")
    .eq("id", projectId)
    .single();
  if (projectError || !project || project.customer_id !== authData.user.id) {
    return NextResponse.json(
      { error: "Project not found or you do not have upload access." },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
  if (!files.length || files.length > MAX_FILES)
    return NextResponse.json(
      { error: "Upload between 1 and 20 files." },
      { status: 400 },
    );

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension))
      return NextResponse.json(
        { error: `${file.name} is not a supported file type.` },
        { status: 400 },
      );
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json(
        { error: `${file.name} is larger than 25 MB.` },
        { status: 400 },
      );
  }

  const uploadedPaths: string[] = [];
  const rows: Array<Record<string, string | number>> = [];
  for (const file of files) {
    const storagePath = `${authData.user.id}/${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      if (uploadedPaths.length)
        await supabase.storage.from("project-files").remove(uploadedPaths);
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
    uploadedPaths.push(storagePath);
    rows.push({
      project_id: projectId,
      uploaded_by: authData.user.id,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
    });
  }

  const { data, error } = await supabase
    .from("project_files")
    .insert(rows)
    .select("id, file_name, mime_type, file_size, created_at");
  if (error) {
    await supabase.storage.from("project-files").remove(uploadedPaths);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ files: data }, { status: 201 });
}
