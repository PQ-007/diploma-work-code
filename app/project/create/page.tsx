"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Loader2, Save, Trash2, X } from "lucide-react";
import { useProjectForm } from "./useProjectForm";
import { ProjectMediaSection } from "./sections/ProjectMediaSection";
import { ProjectMembersSection } from "./sections/ProjectMembersSection";
import { ProjectAttachmentsSection } from "./sections/ProjectAttachmentsSection";
import { ProjectInfoSidebar } from "./sections/ProjectInfoSidebar";

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateProjectPage() {
  const { t } = useTranslation();
  const f = (k: string) => t(`project.form.${k}`);
  const {
    // refs
    titleRef,
    thumbnailInputRef,
    galleryInputRef,
    fileAttachInputRef,
    // core fields
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    projectType,
    setProjectType,
    difficulty,
    setDifficulty,
    tags,
    setTags,
    repositoryUrl,
    setRepositoryUrl,
    demoUrl,
    setDemoUrl,
    videoUrl,
    setVideoUrl,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,
    progress,
    setProgress,
    // media
    selectedMediaId,
    setSelectedMediaId,
    pendingImages,
    setPendingImages,
    uploadingGallery,
    // file attachments
    fileName,
    setFileName,
    fileUrl,
    setFileUrl,
    fileType,
    setFileType,
    // members
    members,
    memberUsername,
    setMemberUsername,
    memberRole,
    setMemberRole,
    addingMember,
    memberError,
    // author meta
    authorName,
    authorAvatar,
    createdAt,
    // UI states
    loading,
    saving,
    deleting,
    saveSuccess,
    uploadingThumbnail,
    uploadingAttach,
    savingFile,
    error,
    setError,
    // auth / routing
    user,
    authLoading,
    editSlug,
    router,
    // helpers
    resizeTitle,
    // handlers
    handleThumbnailUpload,
    handleGalleryUpload,
    handleSave,
    handleDeleteProject,
    handleAddMember,
    handleRemoveMember,
    handleChangeRole,
    handleAttachUpload,
    handleAddFile,
    handleDeleteFile,
    // derived
    youTubeId,
    nonImageFiles,
    galleryStripItems,
    activeGalleryUrl,
  } = useProjectForm();

  if (authLoading || loading) {
    return (
        <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const SaveIcon = saving ? Loader2 : saveSuccess ? Check : Save;
  const saveLabel = saving ? f("saving") : saveSuccess ? f("saved") : editSlug ? f("save") : f("create");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ═══ Main content ═══ */}
        <main className="space-y-8 min-w-0">
          {/* Mobile top bar */}
          {/* Top bar until the sidebar (with Save) sits beside the content at xl */}
          <div className="sticky top-0 z-20 -mx-1 flex items-center justify-between gap-2 bg-background/90 px-1 py-2 backdrop-blur-md xl:hidden">
            <Button variant="ghost" size="sm" onClick={() => router.push("/project")}>
              <ArrowLeft />
              {f("back")}
            </Button>
            <div className="flex items-center gap-2">
              {editSlug && (
                <Button
                  variant="destructive-soft"
                  size="icon-sm"
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  aria-label={f("delete")}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || deleting}
                size="sm"
              >
                <SaveIcon className={saving ? "size-4 animate-spin" : "size-4"} />
                {saveLabel}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-3">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Title ── */}
          <div className="space-y-0.5">
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                resizeTitle();
              }}
              placeholder={f("titlePlaceholder")}
              rows={1}
              className="w-full resize-none overflow-hidden bg-transparent p-0 border-0 outline-none ring-0 focus:ring-0 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl text-foreground placeholder:text-foreground/20"
              style={{ minHeight: "1.05em" }}
            />
            <p className="text-xs text-muted-foreground">{f("titleHint")}</p>
          </div>

          {/* ── Steam-style media viewer ── */}
          <ProjectMediaSection
            title={title}
            selectedMediaId={selectedMediaId}
            setSelectedMediaId={setSelectedMediaId}
            activeGalleryUrl={activeGalleryUrl}
            thumbnailUrl={thumbnailUrl}
            setThumbnailUrl={setThumbnailUrl}
            youTubeId={youTubeId}
            uploadingThumbnail={uploadingThumbnail}
            uploadingGallery={uploadingGallery}
            thumbnailInputRef={thumbnailInputRef}
            galleryInputRef={galleryInputRef}
            pendingImages={pendingImages}
            setPendingImages={setPendingImages}
            galleryStripItems={galleryStripItems}
            editSlug={editSlug}
            handleThumbnailUpload={handleThumbnailUpload}
            handleGalleryUpload={handleGalleryUpload}
            handleDeleteFile={handleDeleteFile}
          />

          {/* ── About card ── */}
          <Card className="gap-4 p-5 sm:p-6">
            <h2 className="text-base font-semibold">{f("about")}</h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={f("aboutPlaceholder")}
              rows={6}
              className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] leading-7 text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
          </Card>

          {/* ── Team / Members ── */}
          <ProjectMembersSection
            members={members}
            memberError={memberError}
            memberUsername={memberUsername}
            setMemberUsername={setMemberUsername}
            memberRole={memberRole}
            setMemberRole={setMemberRole}
            addingMember={addingMember}
            editSlug={editSlug}
            handleAddMember={handleAddMember}
            handleRemoveMember={handleRemoveMember}
            handleChangeRole={handleChangeRole}
          />

          {/* ── Attachments (non-image files) ── */}
          <ProjectAttachmentsSection
            nonImageFiles={nonImageFiles}
            editSlug={editSlug}
            fileName={fileName}
            setFileName={setFileName}
            fileType={fileType}
            setFileType={setFileType}
            fileUrl={fileUrl}
            setFileUrl={setFileUrl}
            uploadingAttach={uploadingAttach}
            savingFile={savingFile}
            fileAttachInputRef={fileAttachInputRef}
            handleAttachUpload={handleAttachUpload}
            handleAddFile={handleAddFile}
            handleDeleteFile={handleDeleteFile}
          />
        </main>

        {/* ═══ Right sidebar ═══ */}
        <ProjectInfoSidebar
          authorAvatar={authorAvatar}
          authorName={authorName}
          user={user}
          repositoryUrl={repositoryUrl}
          setRepositoryUrl={setRepositoryUrl}
          demoUrl={demoUrl}
          setDemoUrl={setDemoUrl}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          youTubeId={youTubeId}
          thumbnailInputRef={thumbnailInputRef}
          thumbnailUrl={thumbnailUrl}
          projectType={projectType}
          setProjectType={setProjectType}
          category={category}
          setCategory={setCategory}
          tags={tags}
          setTags={setTags}
          createdAt={createdAt}
          progress={progress}
          setProgress={setProgress}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          isPublished={isPublished}
          setIsPublished={setIsPublished}
          editSlug={editSlug}
          saving={saving}
          deleting={deleting}
          saveSuccess={saveSuccess}
          saveLabel={saveLabel}
          SaveIcon={SaveIcon}
          router={router}
          handleSave={handleSave}
          handleDeleteProject={handleDeleteProject}
        />
      </div>
    </div>
  );
}
