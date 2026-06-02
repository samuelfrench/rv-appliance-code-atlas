#!/usr/bin/env python3
"""Generate the RV Appliance Code Atlas hero image locally with SDXL/Juggernaut."""

from pathlib import Path
import time

import torch
from diffusers import StableDiffusionXLPipeline

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "images" / "rv-appliance-code-atlas-hero.jpg"
MODELS_ROOT = ROOT.parent / "ComfyUI" / "models"
JUGGERNAUT = MODELS_ROOT / "checkpoints" / "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
SDXL_BASE = MODELS_ROOT / "checkpoints" / "sd_xl_base_1.0.safetensors"

PROMPT = (
    "documentary editorial photo of an RV service bay workbench with a clean multimeter turned away from camera, "
    "plain closed service binders with no writing, a tablet with a dark blank screen, RV appliance vent panel nearby, "
    "organized insulated tools, warm practical shop lighting, realistic textures, shallow depth of field, professional photography, "
    "no logos, no brand names, no letters, no numbers, no readable text anywhere"
)
NEGATIVE = (
    "readable text, letters, numbers, labels, screen text, brand logos, unsafe sparks, fire, smoke, people touching live wires, messy clutter, cartoon, "
    "illustration, blurry, distorted tools, extra fingers, watermark"
)


def checkpoint() -> Path:
    if JUGGERNAUT.exists():
        return JUGGERNAUT
    if SDXL_BASE.exists():
        return SDXL_BASE
    raise FileNotFoundError(f"No local SDXL checkpoint found under {MODELS_ROOT}")


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    torch.cuda.empty_cache()
    model_path = checkpoint()
    print(f"Loading local checkpoint: {model_path}")
    started = time.time()
    pipe = StableDiffusionXLPipeline.from_single_file(
        str(model_path),
        torch_dtype=torch.float16,
        use_safetensors=True,
    )
    pipe = pipe.to("cuda")
    pipe.enable_attention_slicing()
    generator = torch.Generator(device="cuda").manual_seed(20260602)
    image = pipe(
        prompt=PROMPT,
        negative_prompt=NEGATIVE,
        width=1344,
        height=768,
        num_inference_steps=30,
        guidance_scale=6.5,
        generator=generator,
    ).images[0]
    image.save(OUTPUT, format="JPEG", quality=90, optimize=True)
    print(f"Saved {OUTPUT} in {time.time() - started:.1f}s")


if __name__ == "__main__":
    main()
