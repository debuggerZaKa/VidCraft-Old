import mongoose from "mongoose";

const generationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    path: {
      type: String,
      enum: ["api", "remotion", "ref"],
      default: "api",
    },
    contentType: {
      type: String,
      default: "",
    },
    outputType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    genModel: {
      type: String,
      default: "",
    },
    genModelLabel: {
      type: String,
      default: "VidCraft",
    },
    imageDataUrl: {
      type: String,
      default: null,
    },
    videoDataUrl: {
      type: String,
      default: null,
    },
    thumb: {
      type: String,
      default: null,
    },
    cost: {
      type: Number,
      default: 0,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

generationSchema.methods.toClient = function toClient() {
  return {
    id: this._id.toString(),
    prompt: this.prompt,
    path: this.path,
    contentType: this.contentType,
    outputType: this.outputType,
    genModel: this.genModel,
    genModelLabel: this.genModelLabel,
    imageDataUrl: this.imageDataUrl,
    videoDataUrl: this.videoDataUrl,
    thumb: this.thumb || this.imageDataUrl,
    cost: this.cost,
    meta: this.meta,
    timestamp: this.createdAt
      ? this.createdAt.toISOString().slice(0, 16).replace("T", " ")
      : "",
  };
};

export const Generation =
  mongoose.models.Generation || mongoose.model("Generation", generationSchema);
