import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

export function NewChannelView({ onBack, onChannelCreated }) {
  const { activeProject, projects, loadProjects, selectChannel } = useProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // 8 Fields: enabled & label
  const [fields, setFields] = useState([
    { id: 1, key: "field1", enabled: true, name: "Field Label 1" },
    { id: 2, key: "field2", enabled: false, name: "" },
    { id: 3, key: "field3", enabled: false, name: "" },
    { id: 4, key: "field4", enabled: false, name: "" },
    { id: 5, key: "field5", enabled: false, name: "" },
    { id: 6, key: "field6", enabled: false, name: "" },
    { id: 7, key: "field7", enabled: false, name: "" },
    { id: 8, key: "field8", enabled: false, name: "" }
  ]);

  const [metadata, setMetadata] = useState("");
  const [tags, setTags] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [elevation, setElevation] = useState("");

  // Location
  const [showLocation, setShowLocation] = useState(false);
  const [latitude, setLatitude] = useState("0.0");
  const [longitude, setLongitude] = useState("0.0");

  // Video
  const [showVideo, setShowVideo] = useState(false);
  const [videoType, setVideoType] = useState("youtube");
  const [videoUrl, setVideoUrl] = useState("");

  // Status
  const [showStatus, setShowStatus] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFieldToggle(index) {
    const updated = [...fields];
    updated[index].enabled = !updated[index].enabled;
    if (updated[index].enabled && !updated[index].name) {
      updated[index].name = `Field Label ${index + 1}`;
    }
    setFields(updated);
  }

  function handleFieldNameChange(index, val) {
    const updated = [...fields];
    updated[index].name = val;
    setFields(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Channel Name is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let targetProjectId = activeProject?.id || projects[0]?.id;
      if (!targetProjectId) {
        const newProj = await api.createProject({
          name: "Default IoT Project",
          description: "Primary Project for ThingSpeak Channels"
        });
        targetProjectId = newProj.project.id;
      }

      // Collect all enabled fields in order
      const enabledFields = fields
        .filter((f) => f.enabled)
        .map((f, idx) => ({
          field_key: `field${f.id}`,
          name: f.name.trim() || `Field Label ${f.id}`,
          unit: "",
          icon: "activity",
          color: idx % 2 === 0 ? "#10B981" : "#3B82F6"
        }));

      if (enabledFields.length === 0) {
        enabledFields.push({
          field_key: "field1",
          name: "Field Label 1",
          unit: "",
          icon: "activity",
          color: "#10B981"
        });
      }

      const res = await api.createChannel({
        project_id: targetProjectId,
        name: name.trim(),
        description: description.trim(),
        is_public: false,
        metadata: metadata.trim(),
        tags: tags.trim(),
        external_url: externalUrl.trim(),
        github_url: githubUrl.trim(),
        elevation: elevation.trim(),
        latitude: showLocation ? parseFloat(latitude) || 0.0 : null,
        longitude: showLocation ? parseFloat(longitude) || 0.0 : null,
        show_location: showLocation,
        video_type: videoType,
        video_url: videoUrl.trim(),
        show_video: showVideo,
        show_status: showStatus,
        fields: enabledFields
      });

      await loadProjects();
      if (res.channel) {
        await selectChannel(res.channel);
      }

      if (onChannelCreated) {
        onChannelCreated(res.channel);
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      setError(err.message || "Failed to create channel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-7 animate-fadeIn transition-colors text-slate-800 dark:text-slate-200 text-sm">
      {/* Top Back Nav */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#137f3a] dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Channels List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: New Channel Form (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            New Channel
          </h1>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Name */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-12 gap-3 items-start">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300 pt-2">
                Description
              </label>
              <div className="col-span-9">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Fields 1 - 8 */}
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                  Field {f.id}
                </label>
                <div className="col-span-9 flex items-center gap-3">
                  <input
                    type="text"
                    value={f.name}
                    disabled={!f.enabled}
                    onChange={(e) => handleFieldNameChange(idx, e.target.value)}
                    placeholder={f.enabled ? `Field Label ${f.id}` : ""}
                    className={`flex-1 border rounded px-3.5 py-2 text-sm transition-colors ${
                      f.enabled
                        ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                        : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  />
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={() => handleFieldToggle(idx)}
                    className="w-4 h-4 rounded text-[#137f3a] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}

            {/* Metadata */}
            <div className="grid grid-cols-12 gap-3 items-start pt-2">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300 pt-2">
                Metadata
              </label>
              <div className="col-span-9">
                <textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-3 text-right">
                <label className="block font-medium text-slate-700 dark:text-slate-300 pt-2">
                  Tags
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500 block leading-tight">
                  (Tags are comma separated)
                </span>
              </div>
              <div className="col-span-9">
                <textarea
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Link to External Site */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Link to External Site
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="http://"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Link to GitHub */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Link to GitHub
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Elevation */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Elevation
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* Show Channel Location */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Show Channel Location
              </label>
              <div className="col-span-9">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#137f3a] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Latitude
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={latitude}
                  disabled={!showLocation}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="0.0"
                  className={`w-full border rounded px-3.5 py-2 text-sm ${
                    showLocation
                      ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Longitude
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={longitude}
                  disabled={!showLocation}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="0.0"
                  className={`w-full border rounded px-3.5 py-2 text-sm ${
                    showLocation
                      ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            {/* Show Video */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Show Video
              </label>
              <div className="col-span-9 space-y-2">
                <input
                  type="checkbox"
                  checked={showVideo}
                  onChange={(e) => setShowVideo(e.target.checked)}
                  className="w-4 h-4 rounded text-[#137f3a] focus:ring-0 cursor-pointer"
                />

                {showVideo && (
                  <div className="flex items-center gap-5 text-sm pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="videoType"
                        value="youtube"
                        checked={videoType === "youtube"}
                        onChange={() => setVideoType("youtube")}
                        className="text-[#137f3a]"
                      />
                      <span>YouTube</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="videoType"
                        value="vimeo"
                        checked={videoType === "vimeo"}
                        onChange={() => setVideoType("vimeo")}
                        className="text-[#137f3a]"
                      />
                      <span>Vimeo</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Video URL */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Video URL
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={videoUrl}
                  disabled={!showVideo}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="http://"
                  className={`w-full border rounded px-3.5 py-2 text-sm ${
                    showVideo
                      ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            {/* Show Status */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Show Status
              </label>
              <div className="col-span-9">
                <input
                  type="checkbox"
                  checked={showStatus}
                  onChange={(e) => setShowStatus(e.target.checked)}
                  className="w-4 h-4 rounded text-[#137f3a] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Save Channel Button */}
            <div className="grid grid-cols-12 gap-3 pt-3">
              <div className="col-span-3"></div>
              <div className="col-span-9">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-2.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-sm rounded shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? "Saving..." : "Save Channel"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Help & Guidance (col-span-5) */}
        <div className="lg:col-span-5 space-y-6 pt-1 text-sm">
          {/* Help Section */}
          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Help
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Channels store all the data that an AgroNexus application collects. Each channel includes eight fields that can hold any type of data, plus three fields for location data and one for status data. Once you collect data in a channel, you can use AgroNexus apps to analyze and visualize it.
            </p>
          </div>

          {/* Channel Settings Section */}
          <div className="space-y-2.5">
            <h3 className="text-lg font-normal text-slate-800 dark:text-slate-200">
              Channel Settings
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Percentage complete:</strong> Calculated based on data entered into the various fields of a channel. Enter the name, description, location, URL, video, and tags to complete your channel.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Channel Name:</strong> Enter a unique name for the AgroNexus channel.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Description:</strong> Enter a description of the AgroNexus channel.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Field#:</strong> Check the box to enable the field, and enter a field name. Each AgroNexus channel can have up to 8 fields.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Metadata:</strong> Enter information about channel data, including JSON, XML, or CSV data.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Tags:</strong> Enter keywords that identify the channel. Separate tags with commas.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Link to External Site:</strong> If you have a website that contains information about your AgroNexus channel, specify the URL.
              </li>
              <li className="space-y-1">
                <strong className="text-slate-800 dark:text-slate-200">• Show Channel Location:</strong>
                <ul className="pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                  <li>
                    ◦ <strong className="text-slate-700 dark:text-slate-300">Latitude:</strong> Specify the latitude position in decimal degrees. For example, the latitude of the city of London is 51.5072.
                  </li>
                  <li>
                    ◦ <strong className="text-slate-700 dark:text-slate-300">Longitude:</strong> Specify the longitude position in decimal degrees. For example, the longitude of the city of London is -0.1275.
                  </li>
                  <li>
                    ◦ <strong className="text-slate-700 dark:text-slate-300">Elevation:</strong> Specify the elevation position meters. For example, the elevation of the city of London is 35.052.
                  </li>
                </ul>
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Video URL:</strong> If you have a YouTube™ or Vimeo® video that displays your channel information, specify the full path of the video URL.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">• Link to GitHub:</strong> If you store your code on GitHub®, specify the GitHub repository URL.
              </li>
            </ul>
          </div>

          {/* Using the Channel Section */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-lg font-normal text-slate-800 dark:text-slate-200">
              Using the Channel
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              You can get data into a channel from a device, website, or another AgroNexus channel. You can then visualize data and transform it using AgroNexus <span className="text-[#137f3a] dark:text-emerald-400 font-semibold cursor-pointer">Apps</span>.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              See <span className="text-[#137f3a] dark:text-emerald-400 font-semibold cursor-pointer">Get Started with AgroNexus</span> for an example of measuring telemetry from a weather station that acquires data from an Arduino® or ESP32 device.
            </p>
            <div>
              <button
                type="button"
                className="text-sm text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
