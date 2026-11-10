export type GuideSection = {
  heading: string;
  paragraphs: string[];
  steps?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: "Etsy listings" | "POD selling" | "Make a mockup";
  answer: string;
  sections: GuideSection[];
  action: { label: string; href: string };
  sources?: { label: string; href: string }[];
};

export const guides: Guide[] = [
  {
    slug: "etsy-listing-video-without-filming",
    title: "How to Make an Etsy Listing Video Without Filming",
    description: "A practical way for Etsy sellers to turn a product design into a listing video without a camera, physical sample, or video editing software.",
    category: "Etsy listings",
    answer: "You can make an Etsy listing video without filming by placing your artwork on a moving product mockup, exporting the video, and checking the result against Etsy's current upload requirements. Start with a mockup that actually resembles the item you sell.",
    sections: [
      { heading: "Choose the product before choosing the motion", paragraphs: ["A video is useful when it helps a buyer understand the product. For a T-shirt, show the design on the garment while it turns or moves. For a mug, check that the artwork remains readable as the curved surface moves. A dramatic camera move is less useful if it hides the design.", "Match the product color, print position, and overall feel to your real listing. A mockup should explain what the buyer receives; it should not imply a different product or print method."] },
      { heading: "Make the video in your browser", paragraphs: ["Open a matching mockup, add your PNG or JPG, then adjust the artwork's position and size while watching the preview. Generate the finished video only after the design looks right. LeeMockups also provides matching still images from the same scene, so your listing can use a consistent look."], steps: ["Select a T-shirt, mug, or frame mockup that matches your product.", "Upload the design and inspect its size, placement, and edges.", "Generate the video and watch it from beginning to end.", "Save the video and still images, then add the files to the relevant listing."] },
      { heading: "Check the listing before publishing", paragraphs: ["Watch the exported file on a phone-sized screen. Make sure the product is identifiable immediately, the artwork stays visible, and no crop or seam appears during movement. Etsy's video specifications can change, so check its own help page before uploading. The listing's photos, title, and description still need to describe the actual product accurately."] },
    ],
    action: { label: "Try a video mockup", href: "/composer/" },
    sources: [{ label: "Etsy: How to add a listing video", href: "https://help.etsy.com/hc/en-us/articles/360053206073-How-to-Add-Listing-Videos" }],
  },
  {
    slug: "video-mockup-without-photoshop-or-3d",
    title: "How to Make a Video Mockup Without Photoshop or 3D Software",
    description: "Create a product video mockup in a browser by uploading artwork, adjusting its placement, and exporting a video and matching stills.",
    category: "Make a mockup",
    answer: "You do not need to edit a PSD or build a 3D scene to make a video mockup. In a browser-based creator, the product scene and motion are prepared for you; your job is to choose the right scene, place the artwork, and review the output.",
    sections: [
      { heading: "Prepare one clear design file", paragraphs: ["Use a PNG when you need transparent edges around a logo or illustration. Use a JPG when the image itself should fill a rectangular print area. Give the artwork enough resolution for the final placement, and inspect it at full size for accidental white backgrounds or rough edges."] },
      { heading: "Fit the design to the product", paragraphs: ["Pick the mockup first, then upload the design. Move or resize it in the artwork placement area and watch the product preview update. The usable area may be a rectangle on a poster or a less regular region on apparel. Keep important text and details away from its edges.", "A still preview can look correct while a moving product reveals a problem. Play the complete exported video before using it in a store listing."] },
      { heading: "Export and reuse the scene", paragraphs: ["When the placement looks right, create the video and save the matching still images. Use the stills for listing photos or social posts and the video where motion adds information. Creation time depends on the mockup package, output settings, browser, and device; treat any two-minute example as a measured result, not a promise."] },
    ],
    action: { label: "Open the mockup generator", href: "/composer/" },
  },
  {
    slug: "choose-mockups-for-print-on-demand",
    title: "How to Choose Mockups for a Print-on-Demand Store",
    description: "Choose product mockups for a POD store by matching the real item, showing the design clearly, and using consistent scenes across listings.",
    category: "POD selling",
    answer: "The best POD mockup is the one that gives buyers an accurate, readable view of the item they can order. Start with the product and print location, then choose a scene and motion that make those details easier to understand.",
    sections: [
      { heading: "Match the actual product", paragraphs: ["Check the garment cut, mug shape, frame orientation, color, and print position. A beautiful scene can still create confusion if it shows a different product. Keep a straightforward product view among your listing images, even when you also use a lifestyle scene."] },
      { heading: "Use variety with a purpose", paragraphs: ["For a collection of T-shirts, try one clean studio view and one scene that fits the audience. For wall art, show a frame both close enough to read and in a room that communicates scale. For mugs, choose a view where the handle and design placement are understandable. The aim is to answer different buyer questions, not to fill every image slot with a similar angle."] },
      { heading: "Check readability on a small screen", paragraphs: ["Look at the thumbnail at the size a shopper will first see it. If the design disappears into the background, choose another angle or crop. Watch moving mockups for moments when artwork leaves the visible surface. Before publishing, compare the mockup with the print provider's product specifications and a physical sample when available."] },
    ],
    action: { label: "Browse product mockups", href: "/mockups/" },
  },
  {
    slug: "t-shirt-video-mockup-for-etsy",
    title: "How to Make a T-Shirt Video Mockup for an Etsy Shop",
    description: "A T-shirt-specific workflow for placing print artwork, checking motion, and preparing listing assets for Etsy.",
    category: "Etsy listings",
    answer: "Choose a shirt mockup close to the shirt you sell, place the design inside the printable area, and review the entire moving preview. The print should stay legible as the garment changes angle.",
    sections: [
      { heading: "Start with the shirt buyers will recognize", paragraphs: ["Match the color, neckline, sleeve shape, and intended print position where possible. If your listing has multiple shirt colors, do not let a video of one color imply that every option looks identical. Keep your main product photo clear and use video to add a view of movement and scale."] },
      { heading: "Place the artwork deliberately", paragraphs: ["Upload a clean transparent PNG for logos or illustrations with irregular edges. Move it up or down on the shirt and compare the result with your print provider's placement. For small text, preview at mobile size. Leave room from the edge of the printable area so distortion during motion does not clip letters or borders."] },
      { heading: "Review the complete export", paragraphs: ["Play the video from start to finish, not just its first frame. Check the design as the fabric bends and the camera moves. Inspect the still images separately, then add only the assets that accurately represent the product. If the artwork looks too small or too low, adjust it and generate again."] },
    ],
    action: { label: "Browse apparel mockups", href: "/mockups/apparel/" },
  },
  {
    slug: "mug-video-mockup-for-pod",
    title: "How to Make a Mug Video Mockup for a POD Design",
    description: "Make a moving mug mockup while keeping the design readable around the curved surface and handle.",
    category: "POD selling",
    answer: "A mug video mockup works best when its shape and artwork placement match the mug you sell. Put essential text in a position that remains visible during motion, then inspect the full turn before exporting.",
    sections: [
      { heading: "Choose the right mug and angle", paragraphs: ["A handle can hide one side of a mug, and a curved surface can make a wide design look different from the flat artwork file. Choose a mockup close to the real product's shape and color. If the design wraps around both sides, a single angle may not show all of it; use additional still images to explain the rest."] },
      { heading: "Position for readability", paragraphs: ["Upload the design, inspect the live preview, and resize it until the important elements have breathing room. Do not judge placement solely from the flat artwork area. Watch the rendered surface as the mug turns, especially where the print approaches the far edge or handle."] },
      { heading: "Use the output honestly", paragraphs: ["Save the video and matching stills only after checking their crop and clarity. If your print provider has a different printable area, compare against its template before using the mockup in a sales listing. A mockup can show the concept well, but it does not replace a sample when exact print color matters."] },
    ],
    action: { label: "Browse mug mockups", href: "/mockups/mugs/" },
  },
  {
    slug: "frame-mockups-for-wall-art",
    title: "How to Show Wall Art with Frame Mockups",
    description: "Choose frame mockups that communicate artwork proportions, room context, and a clear close-up for wall-art listings.",
    category: "POD selling",
    answer: "Use frame mockups to show two things: what the artwork looks like inside a frame and how it feels in a room. Keep the art large enough to inspect and ensure the frame ratio matches the format you offer.",
    sections: [
      { heading: "Start with the aspect ratio", paragraphs: ["A portrait print placed into a landscape frame can be cropped or surrounded by unintended space. Check the artwork ratio against the mockup's design area. If you sell several print sizes, confirm which one each image represents and avoid suggesting that the framing is identical across all sizes."] },
      { heading: "Combine context and detail", paragraphs: ["A room scene can help buyers imagine the artwork on a wall, but it may make small design details hard to see. Pair it with a closer product view. Keep furniture and lighting from competing with the art. If a video mockup moves through a scene, review every point where glare, shadow, or perspective changes how the design looks."] },
      { heading: "Check the listing claim", paragraphs: ["Be clear about whether the customer receives a framed item, an unframed print, or a digital file. Use captions or listing text where the mockup could be misread. The mockup supports the sale only when the visual matches what the buyer can actually purchase."] },
    ],
    action: { label: "Browse frame mockups", href: "/mockups/frames/" },
  },
  {
    slug: "prepare-artwork-for-product-mockup",
    title: "How to Prepare Artwork for a Product Mockup",
    description: "Prepare PNG or JPG artwork for apparel, mugs, and frames without unwanted backgrounds, clipping, or blurry details.",
    category: "Make a mockup",
    answer: "Export a clean PNG or JPG at a useful size, then choose the mockup that matches its shape. Check transparency, aspect ratio, and the placement boundary before creating the final video.",
    sections: [
      { heading: "Pick PNG or JPG based on the artwork", paragraphs: ["Use PNG for artwork that needs transparent space around its shape, such as a shirt graphic or logo. Use JPG for a full rectangular image, such as a photo intended to fill a frame. A JPG always has a background; a white rectangle around a logo is usually a file problem rather than a mockup problem."] },
      { heading: "Leave room for movement and perspective", paragraphs: ["A print area on a 3D product may curve, tilt, or fold in the final view. Keep text and important edges away from the boundary. If an uploaded image reaches every side of the editable area, reduce its size slightly and see whether the result is more natural. Compare the preview with the actual print provider's template."] },
      { heading: "Inspect before the final export", paragraphs: ["Zoom into the preview to catch jagged edges or unexpectedly soft text, then view it at typical shopping size. Generate a video only when the still preview looks right, and watch the full motion after export. Keep your original artwork file so you can adjust placement for another scene without rebuilding the design."] },
    ],
    action: { label: "Try artwork placement", href: "/composer/" },
  },
  {
    slug: "etsy-listing-video-checklist",
    title: "Etsy Listing Video Checklist for POD Sellers",
    description: "A practical pre-upload checklist for product videos: accurate product, readable design, suitable format, and complete playback review.",
    category: "Etsy listings",
    answer: "Before uploading an Etsy listing video, confirm that it shows the product you sell, keeps the design visible, plays cleanly from start to finish, and meets Etsy's current file rules. Platform requirements should be checked on Etsy's own help page on the day you publish.",
    sections: [
      { heading: "Product accuracy", paragraphs: ["Does the shown shirt, mug, or frame resemble the item in your listing? Are color, shape, and design placement representative? If you offer options, a single mockup should not suggest an option is included when it is not."] },
      { heading: "Visual clarity", paragraphs: ["Watch on a phone as well as a desktop screen. The design should appear early, remain readable, and avoid distracting seams, clipping, or abrupt changes. Check the first frame: shoppers may decide whether to watch based on what they see before playback."] },
      { heading: "Technical and listing checks", paragraphs: ["Open the actual exported file and play it all the way through. Check Etsy's current video duration, size, and supported format requirements before upload. After upload, preview the listing again; the platform may process or display the video differently. Keep the title, photos, and description focused on the physical or digital product the buyer will receive."], steps: ["Match the mockup to the item for sale.", "Check artwork placement and full playback.", "Check Etsy's latest upload rules.", "Preview the published listing on mobile."] },
    ],
    action: { label: "Explore video mockups", href: "/mockups/" },
    sources: [{ label: "Etsy: How to add a listing video", href: "https://help.etsy.com/hc/en-us/articles/360053206073-How-to-Add-Listing-Videos" }],
  },
  {
    slug: "mockup-generator-tools-2026",
    title: "How to Choose a Mockup Generator in 2026",
    description: "Compare Canva, Kittl, Mockey, Placeit, and LeeMockups by product fit, artwork control, video output, and complete workflow time.",
    category: "Make a mockup",
    answer: "The right mockup generator depends on what you sell and what you need to export. Check product realism, design placement, video support, output size, and total workflow time with your own artwork before choosing a tool.",
    sections: [
      { heading: "Start with the asset your listing needs", paragraphs: ["A seller who needs one still image has a different requirement from a seller who needs a moving product video and matching stills. Make a short list of products you actually sell, including shirt styles, mug shapes, and frame ratios. Then check whether each tool offers a close visual match.", "A large template library is useful only when the relevant product and angle are present. Review the actual scene rather than relying on the total number of templates advertised."] },
      { heading: "Which tools should you inspect?", paragraphs: ["Canva documents photo and video mockups inside its editor. Kittl describes an AI video workflow that can animate a mockup on its canvas. Mockey describes browser-based product and video mockups. Placeit offers online mockup and video templates. LeeMockups focuses on placing artwork into prepared moving product scenes and exporting a video with matching stills.", "These are different workflows, not a ranked list. The provider pages confirm available features; they do not establish which one produces the best result for your product. Test the same artwork in the scenes you would actually use, and check current plan limits and licensing before deciding."] },
      { heading: "Test the design controls", paragraphs: ["Upload the same PNG or JPG to each tool. Try to position the artwork, change its size, inspect the edges, and undo a poor placement. Look at the result on a small screen. If a tool does not show the placement clearly before export, the extra retries can cost more time than the first setup.", "For video mockups, watch the entire generated clip. A good first frame does not prove the design stays readable during motion or that the exported file is sharp."] },
      { heading: "Measure the whole workflow", paragraphs: ["Time the process from selecting a scene to opening the final file. Include upload, adjustment, rendering, and download. A two-minute result may be possible for some files and devices, but it is not a reliable promise for every mockup. Also check file format, output resolution, licensing terms, and whether your artwork is sent to a server.", "Write down your own results for each candidate. Tool features and prices change, so verify them on the provider's current product page before buying."] },
    ],
    action: { label: "Try the browser generator", href: "/composer/" },
    sources: [
      { label: "Canva Help: Create mockups using images or designs", href: "https://www.canva.com/help/mockup-design/" },
      { label: "Kittl Help: Use Kittl Video", href: "https://help.kittl.com/ai-tools/kittl-video/" },
      { label: "Mockey Help: What Is Mockey AI?", href: "https://mockey.ai/help-center/getting-started/what-is-mockey-ai" },
      { label: "Placeit Help: Why do I need Placeit?", href: "https://help.placeit.net/hc/en-us/articles/37793387739161-Why-do-I-need-Placeit" },
    ],
  },
  {
    slug: "product-videos-for-shopify-pod-store",
    title: "How to Use Product Videos in a Shopify POD Store",
    description: "Plan product videos for a Shopify print-on-demand store, from matching the real product to checking the mobile product page.",
    category: "POD selling",
    answer: "A product video is useful when it answers a buying question that still photos leave open. For a POD store, show the design on the right product, keep it readable during movement, and check how the video appears on the actual product page.",
    sections: [
      { heading: "Decide what the video should explain", paragraphs: ["A T-shirt video can show how artwork sits on the garment. A mug video can reveal the print as the cup rotates. A frame video can add room context and a closer look at the art. Choose one clear purpose per clip instead of adding motion only because the theme supports video."] },
      { heading: "Keep the product page consistent", paragraphs: ["Use the same garment type, color, artwork, and frame ratio shown in the product options. Pair the video with still images that show details the moving clip might miss. If the product page offers multiple variants, explain which variant appears in the video rather than implying that every option looks the same."] },
      { heading: "Review on the storefront", paragraphs: ["After uploading, test the page on a phone and a desktop. Check the thumbnail, first frame, loading time, controls, and whether the product description stays easy to reach. Follow Shopify's current media guidance for supported formats and theme behavior; test the published page instead of assuming the uploaded file will display identically everywhere."] },
    ],
    action: { label: "Explore product mockups", href: "/mockups/" },
    sources: [{ label: "Shopify Help Center: Product media", href: "https://help.shopify.com/en/manual/products/product-media" }],
  },
  {
    slug: "still-vs-video-mockups-for-etsy",
    title: "Still vs Video Mockups for Etsy Listings",
    description: "Decide when a still product mockup is enough and when motion helps Etsy buyers understand a POD product.",
    category: "Etsy listings",
    answer: "Use still mockups to give shoppers a fast, clear product view. Add a video when movement reveals something useful, such as how a design wraps around a mug or sits on a T-shirt. The two formats work best together when they answer different questions.",
    sections: [
      { heading: "Let the first image do its job", paragraphs: ["A buyer often meets your listing as a small search thumbnail. Choose a still image with a recognizable product and readable design. Avoid filling the frame with a decorative scene when the actual artwork becomes tiny. The video should add information rather than compensate for an unclear cover image."] },
      { heading: "Use motion selectively", paragraphs: ["A turning mug can reveal placement on a curved surface. A moving shirt can show scale and how a print behaves as the fabric changes angle. For wall art, a slow change in perspective may communicate the room setting. If motion makes the design harder to see, a second still image may be the better asset."] },
      { heading: "Keep all assets consistent", paragraphs: ["Generate stills and video from the same design and scene when possible. Compare color, crop, and print position across the set. Rewatch the exported clip after upload and check Etsy's current media requirements before publishing. This is a product presentation decision, not a guarantee that adding video will change search ranking."] },
    ],
    action: { label: "Browse video mockups", href: "/mockups/" },
    sources: [{ label: "Etsy: How to add a listing video", href: "https://help.etsy.com/hc/en-us/articles/360053206073-How-to-Add-Listing-Videos" }],
  },
  {
    slug: "fresh-pod-mockup-scenes-without-rebuilding-artwork",
    title: "How to Refresh POD Mockups Without Rebuilding Your Design",
    description: "Create useful scene variety for T-shirts, mugs, and wall art while keeping the product and artwork consistent.",
    category: "POD selling",
    answer: "You can refresh a POD listing by using the same artwork in a second scene with a different purpose. Keep the product accurate, then vary the setting or camera angle to answer a new buyer question rather than making several nearly identical images.",
    sections: [
      { heading: "Give each scene a role", paragraphs: ["Use a clean studio image to show the product clearly. Use a room or lifestyle scene to add context. Use a closer crop for small details. For a mug, one view might show the front print and another the handle. For wall art, one scene might show the full room and another the frame ratio."] },
      { heading: "Reuse the artwork carefully", paragraphs: ["Start with the original design file and place it on the next mockup. Adjust size and position for that product's printable area; copying the exact coordinates from another scene can produce a different visual scale. Check the full video when the new scene moves or changes perspective."] },
      { heading: "Avoid artificial variety", paragraphs: ["Changing only the lighting may make a gallery look fuller without telling the buyer anything new. Compare the images at thumbnail size and remove near duplicates. Make sure each scene still represents the item a buyer will receive, especially if the product has size or color variants."] },
    ],
    action: { label: "Find another scene", href: "/mockups/" },
  },
];

export const featuredGuideSlugs = [
  "etsy-listing-video-without-filming",
  "video-mockup-without-photoshop-or-3d",
  "choose-mockups-for-print-on-demand",
  "etsy-listing-video-checklist",
];

export function guideBySlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}


