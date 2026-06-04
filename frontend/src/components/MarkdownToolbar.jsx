import { LinkIcon, CameraIcon, DocumentIcon } from "./Icons";

const tools = [
	{ icon: "B", label: "Bold", wrapper: "**", shortcut: "⌘B" },
	{ icon: "I", label: "Italic", wrapper: "_", shortcut: "⌘I" },
	{ icon: "H1", label: "Large Heading", wrapper: "# ", shortcut: "⌘1" },
	{ icon: "H2", label: "Medium Heading", wrapper: "## ", shortcut: "⌘2" },
	{ icon: "H3", label: "Small Heading", wrapper: "### ", shortcut: "⌘3" },
	{ icon: "❝", label: "Quote", wrapper: "> ", shortcut: "⌘⇧." },
	{ icon: "•", label: "Bullet List", wrapper: "- ", shortcut: "⌘⇧8" },
	{ icon: "1.", label: "Numbered List", wrapper: "1. ", shortcut: "⌘⇧7" },
	{ icon: "⌘", label: "Code", wrapper: "`", shortcut: "⌘E" },
	{ icon: "{ }", label: "Code Block", wrapper: "```\n", endWrapper: "\n```", shortcut: "⌘⇧C" },
	{ icon: "link", label: "Link", wrapper: "[", endWrapper: "](url)", shortcut: "⌘K" },
	{ icon: "image", label: "Image", wrapper: "![", endWrapper: "](url)", shortcut: "⌘⇧I" },
	{ icon: "―", label: "Divider", wrapper: "\n---\n", shortcut: "⌘-" },
	{ icon: "✓", label: "Task List", wrapper: "- [ ] ", shortcut: "⌘T" },
	{
		icon: "table",
		label: "Table",
		wrapper: "| Header | Header |\n|---------|----------|\n| Cell | Cell |",
		shortcut: "⌘⇧T",
	},
];

const toolGroups = [
	["B", "I"],
	["H1", "H2", "H3"],
	["•", "1.", "✓"],
	["❝", "⌘", "{ }"],
	["link", "image"],
	["―", "table"],
];

export default function MarkdownToolbar({ textareaRef }) {
	const insertText = (wrapper, endWrapper = wrapper) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selectedText = text.substring(start, end);

		const newText = text.substring(0, start) + wrapper + selectedText + endWrapper + text.substring(end);

		// Trigger React Hook Form change event
		const event = new Event("input", { bubbles: true });
		textarea.value = newText;
		textarea.dispatchEvent(event);

		// Reset cursor position
		textarea.focus();
		const newCursorPos = start + wrapper.length + selectedText.length;
		textarea.setSelectionRange(newCursorPos, newCursorPos);
	};

	return (
		<div className="flex flex-wrap gap-1 mb-2 p-1 bg-primary-surface/30 rounded-lg border border-primary-gold/10">
			{toolGroups.map((group, groupIndex) => (
				<div key={groupIndex} className="flex items-center gap-1">
					{group.map((icon) => {
						const tool = tools.find((t) => t.icon === icon);
						if (!tool) return null;
						return (
							<button
								key={tool.label}
								type="button"
								onClick={() => insertText(tool.wrapper, tool.endWrapper)}
								className="p-2 text-sm rounded hover:bg-primary-gold/10 text-text-secondary hover:text-primary-gold transition-colors group relative"
								title={`${tool.label} ${tool.shortcut}`}
							>
								{tool.icon === "link" ? (
									<LinkIcon className="w-4 h-4" />
								) : tool.icon === "image" ? (
									<CameraIcon className="w-4 h-4" />
								) : tool.icon === "table" ? (
									<DocumentIcon className="w-4 h-4" />
								) : (
									<span>{tool.icon}</span>
								)}
								{/* Tooltip */}
								<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-primary-surface border border-primary-gold/10 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
									{tool.label}
									<span className="ml-2 text-text-secondary">{tool.shortcut}</span>
								</div>
							</button>
						);
					})}
					{groupIndex < toolGroups.length - 1 && <div className="w-px h-6 bg-primary-gold/10 mx-1" />}
				</div>
			))}
		</div>
	);
}
