"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <div className="h-14 w-1/2 bg-muted animate-pulse rounded" />
          <div className="aspect-video bg-muted animate-pulse rounded-md" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const SaveIcon = saving ? Loader2 : saveSuccess ? Check : Save;
  const saveLabel = saving
    ? "Saving…"
    : saveSuccess
      ? "Saved!"
      : editSlug
        ? "Save Changes"
        : "Create Project";

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_90%_2%,hsl(var(--primary)/0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* ═══ Main content ═══ */}
        <main className="space-y-8 min-w-0">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/project")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {editSlug && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  title="Delete project"
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
                <SaveIcon
                  className={`h-4 w-4 mr-1 ${saving ? "animate-spin" : ""}`}
                />
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
              placeholder="YOUR PROJECT TITLE"
              rows={1}
              className="w-full resize-none overflow-hidden bg-transparent p-0 border-0 outline-none ring-0 focus:ring-0 text-3xl md:text-4xl lg:text-[46px] leading-[1.05] font-black uppercase tracking-tight text-foreground placeholder:text-foreground/20"
              style={{ minHeight: "1.05em" }}
            />
            <p className="text-[10px] text-muted-foreground/40 pl-0.5">
              Click above to edit title
            </p>
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
          <Card className="border-border/80 bg-card/90 text-card-foreground p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-black uppercase tracking-tight">
              About The Project
            </h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, its goals, and what makes it unique…"
              rows={6}
              className="w-full resize-none bg-transparent rounded-md border border-dashed border-border/40 hover:border-border/70 focus:border-primary/50 p-2 -mx-2 text-sm sm:text-[15px] leading-7 text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:text-foreground transition-colors"
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
          description={description}
          setDescription={setDescription}
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
