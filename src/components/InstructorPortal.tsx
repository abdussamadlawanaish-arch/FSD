import React, { useState } from 'react';
import {
  CheckCircle2,
  LogOut,
  Minus,
  Plus,
  Save,
  Search,
  UserCheck,
} from 'lucide-react';
import { AuthSession, COURSE_PACKAGES, PracticalScores, SCHOOL_INFO, StudentRecord } from '../types';

interface InstructorPortalProps {
  session: AuthSession;
  students: StudentRecord[];
  onUpdateAssessment: (
    studentId: string,
    patch: {
      attendanceSessions?: number;
      theoryScore?: number;
      practicalScores?: PracticalScores;
      instructorFeedback?: string;
      oneMonthTrainingCompleted?: boolean;
    }
  ) => Promise<void>;
  onLogout: () => void;
}

export const InstructorPortal: React.FC<InstructorPortalProps> = ({
  session,
  students,
  onUpdateAssessment,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(students[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nin.includes(q)
    );
  });

  const activeStudent =
    students.find((s) => s.id === selectedId) || filteredStudents[0] || students[0];

  const [draft, setDraft] = useState<StudentRecord | null>(activeStudent || null);

  const selectStudent = (student: StudentRecord) => {
    setSelectedId(student.id);
    setDraft({ ...student, practicalScores: { ...student.practicalScores } });
    setSavedNotice('');
  };

  React.useEffect(() => {
    if (activeStudent && (!draft || draft.id !== activeStudent.id)) {
      setDraft({ ...activeStudent, practicalScores: { ...activeStudent.practicalScores } });
    }
  }, [activeStudent, draft]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      await onUpdateAssessment(draft.id, {
        attendanceSessions: draft.attendanceSessions,
        theoryScore: draft.theoryScore,
        practicalScores: draft.practicalScores,
        instructorFeedback: draft.instructorFeedback,
        oneMonthTrainingCompleted: draft.oneMonthTrainingCompleted,
      });
      setSavedNotice(`Saved attendance & assessment for ${draft.fullName}.`);
      setTimeout(() => setSavedNotice(''), 3500);
    } catch (err) {
      setSavedNotice((err as Error).message || 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  const toggleOneMonthComplete = async () => {
    if (!draft) return;
    const nextVal = !draft.oneMonthTrainingCompleted;
    setSaving(true);
    try {
      await onUpdateAssessment(draft.id, {
        oneMonthTrainingCompleted: nextVal,
      });
      setDraft({
        ...draft,
        oneMonthTrainingCompleted: nextVal,
        trainingCompletedAt: nextVal ? new Date().toISOString() : undefined,
      });
      setSavedNotice(
        nextVal
          ? `Marked 1-Month Training Completed for ${draft.fullName}.`
          : `Reverted 1-Month Training status for ${draft.fullName}.`
      );
      setTimeout(() => setSavedNotice(''), 3500);
    } catch (err) {
      setSavedNotice((err as Error).message || 'Could not update completion status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#0A2E7A]/20 bg-white/95 p-6 shadow-xs">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
            Instructor Portal · {SCHOOL_INFO.name}
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome, {session.displayName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono-tabular">
            <span>
              Instructor ID:{' '}
              <strong className="text-[#0A2E7A]">{session.staffId || 'INST-FDS-001'}</strong>
            </span>
            {session.specialty && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-sans">
                  Specialty: <strong className="text-slate-800">{session.specialty}</strong>
                </span>
              </>
            )}
            {session.email && (
              <>
                <span aria-hidden="true">·</span>
                <span>{session.email}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-center whitespace-nowrap"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Student Roster */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white/95 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Assigned Students ({students.length})
            </h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, Student ID, or NIN..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
            />
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                No students match your search query.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = draft?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => selectStudent(st)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#0A2E7A] bg-[#0A2E7A]/[0.05]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {st.fullName}
                      </span>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          st.oneMonthTrainingCompleted ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {st.oneMonthTrainingCompleted ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono-tabular">
                      <span>{st.id}</span>
                      <span>
                        {st.attendanceSessions}/{st.totalRequiredSessions} sessions · Theory{' '}
                        {st.theoryScore}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Student Assessment Form */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white/95 p-6">
          {!draft ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Select a student from the roster to record attendance and driving scores.
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-mono-tabular text-slate-500">
                    {draft.id} · NIN: {draft.nin} · {draft.licenseClass}
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-[#0A2E7A]">
                    {draft.fullName}
                  </h2>
                  <div className="text-xs text-slate-600">
                    {COURSE_PACKAGES[draft.packageId].title}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleOneMonthComplete}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    draft.oneMonthTrainingCompleted
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'border-2 border-[#0A2E7A] bg-white text-[#0A2E7A] hover:bg-[#0A2E7A]/5'
                  }`}
                >
                  {draft.oneMonthTrainingCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>1-Month Training Completed</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Mark 1-Month Training Completed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Attendance Logger & Classroom Theory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Physical Campus Attendance (Max {draft.totalRequiredSessions} Sessions)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          attendanceSessions: Math.max(0, draft.attendanceSessions - 1),
                        })
                      }
                      aria-label="Decrease attendance"
                      className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={draft.totalRequiredSessions}
                      value={draft.attendanceSessions}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          attendanceSessions: Math.min(
                            draft.totalRequiredSessions,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono-tabular text-sm font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          attendanceSessions: Math.min(
                            draft.totalRequiredSessions,
                            draft.attendanceSessions + 1
                          ),
                        })
                      }
                      aria-label="Increase attendance"
                      className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Classroom Theory Score (0–100%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.theoryScore}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        theoryScore: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono-tabular text-sm font-bold text-[#0A2E7A] focus:border-[#0A2E7A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Practical Driving Scorecard */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Practical Driving Scorecard (0–100%)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'steering' as const, label: 'Steering Control (%)' },
                    { key: 'parking' as const, label: 'Parking & Reversing (%)' },
                    { key: 'roadSigns' as const, label: 'Road Signs & Rules (%)' },
                    { key: 'defensiveDriving' as const, label: 'Defensive Driving (%)' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-slate-200 bg-white p-3.5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          {item.label}
                        </label>
                        <span className="font-mono-tabular text-xs font-bold text-[#0A2E7A]">
                          {draft.practicalScores[item.key]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={draft.practicalScores[item.key]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            practicalScores: {
                              ...draft.practicalScores,
                              [item.key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-[#0A2E7A] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instructor Performance Feedback
                </label>
                <textarea
                  rows={3}
                  value={draft.instructorFeedback}
                  onChange={(e) => setDraft({ ...draft, instructorFeedback: e.target.value })}
                  placeholder="Enter practical driving observations, strengths, or areas to improve..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                />
              </div>

              {savedNotice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                  {savedNotice}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#082361] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4 text-[#F5B700]" />
                  <span>{saving ? 'Saving...' : 'Save Attendance & Scorecard'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
