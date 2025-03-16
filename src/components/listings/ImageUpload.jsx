import React, { useCallback } from 'react';
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImagePlus, X, Loader2 } from "lucide-react";

export default function ImageUpload({ images, onChange }) {
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await UploadFile({ file });
          return file_url;
        })
      );

      onChange([...images, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
    }
    setUploading(false);
  };

  const removeImage = (indexToRemove) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <Card key={index} className="relative group aspect-square">
            <img
              src={url}
              alt={`Listing image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </Card>
        ))}
        
        <Card className="aspect-square flex items-center justify-center border-2 border-dashed border-[#F4812C]/30 hover:border-[#F4812C] transition-colors">
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center text-[#1B2841]/60">
                <Loader2 className="w-8 h-8 animate-spin text-[#F4812C]" />
                <span className="mt-2 text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-[#1B2841]/60 hover:text-[#F4812C] transition-colors">
                <ImagePlus className="w-8 h-8" />
                <span className="mt-2 text-sm">Add Photos</span>
              </div>
            )}
          </label>
        </Card>
      </div>
      <p className="text-sm text-[#1B2841]/60">
        Upload up to 8 images. First image will be the main listing photo.
      </p>
    </div>
  );
}