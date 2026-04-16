"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  createChapterDivision,
  deleteChapterDivision,
  getChapterDivisions,
  deleteAllChapterDivisions,
} from "@/features/academy/actions/chapterDivisionActions";

interface ChapterDivision {
  id: number;
  chapterId: number;
  pageStart: number;
  pageEnd: number;
  orderNo: number;
}

interface DivideChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterName: string;
  pageStart: number;
  pageEnd: number;
}

export default function DivideChapterModal({
  isOpen,
  onClose,
  chapterId,
  chapterName,
  pageStart,
  pageEnd,
}: DivideChapterModalProps) {
  const [divisions, setDivisions] = useState<ChapterDivision[]>([]);
  const [newPageStart, setNewPageStart] = useState<string>("");
  const [newPageEnd, setNewPageEnd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadDivisions();
    }
  }, [isOpen, chapterId]);

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const data = await getChapterDivisions(chapterId);
      setDivisions(data);
      setError("");
    } catch (err) {
      setError("Failed to load divisions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDivision = async () => {
    if (!newPageStart || !newPageEnd) {
      setError("Please enter both page numbers");
      return;
    }

    const start = parseInt(newPageStart);
    const end = parseInt(newPageEnd);

    if (start < pageStart || end > pageEnd || start > end) {
      setError(
        `Pages must be between ${pageStart} and ${pageEnd}, and start must be less than end`
      );
      return;
    }

    // Check if this exact range already exists
    const isDuplicate = divisions.some(
      (div) => div.pageStart === start && div.pageEnd === end
    );
    if (isDuplicate) {
      setError(`Pages ${start} — ${end} is already divided`);
      return;
    }

    // Check if the new range overlaps with existing divisions
    const hasOverlap = divisions.some(
      (div) =>
        (start >= div.pageStart && start <= div.pageEnd) ||
        (end >= div.pageStart && end <= div.pageEnd) ||
        (start < div.pageStart && end > div.pageEnd)
    );
    if (hasOverlap) {
      setError(
        `Pages ${start} — ${end} overlaps with an existing division`
      );
      return;
    }

    try {
      setLoading(true);
      const orderNo = divisions.length + 1;
      await createChapterDivision(chapterId, start, end, orderNo);
      setNewPageStart("");
      setNewPageEnd("");
      await loadDivisions();
      setError("");
    } catch (err) {
      setError("Failed to add division");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDivision = async (divisionId: number) => {
    try {
      setLoading(true);
      await deleteChapterDivision(divisionId);
      await loadDivisions();
      setError("");
    } catch (err) {
      setError("Failed to delete division");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all divisions for this chapter?"
      )
    ) {
      try {
        setLoading(true);
        await deleteAllChapterDivisions(chapterId);
        await loadDivisions();
        setError("");
      } catch (err) {
        setError("Failed to clear divisions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Divide Chapter: {chapterName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pages {pageStart} — {pageEnd}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Add New Division */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Add New Division
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Start Page
                </label>
                <input
                  type="number"
                  min={pageStart}
                  max={pageEnd}
                  value={newPageStart}
                  onChange={(e) => setNewPageStart(e.target.value)}
                  placeholder="e.g., 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  End Page
                </label>
                <input
                  type="number"
                  min={pageStart}
                  max={pageEnd}
                  value={newPageEnd}
                  onChange={(e) => setNewPageEnd(e.target.value)}
                  placeholder="e.g., 2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleAddDivision}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-bold"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Divisions List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Divisions ({divisions.length})
              </h3>
              {divisions.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-xs text-red-600 hover:text-red-700 font-bold disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
            </div>

            {divisions.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center border border-dashed border-slate-300">
                <p className="text-sm text-slate-500">
                  No divisions yet. Add one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">
                        {division.orderNo}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Pages {division.pageStart} — {division.pageEnd}
                        </p>
                        <p className="text-xs text-slate-500">
                          {division.pageEnd - division.pageStart + 1} page(s)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDivision(division.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Divide chapters into sub-pages for better
              lesson planning. For example, divide a 4-page chapter into: 1-2,
              2-3, 3-4 for flexible lesson scheduling.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-bold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
