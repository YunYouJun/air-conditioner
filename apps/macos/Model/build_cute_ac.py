"""
Build the low-poly cartoon air-conditioner headlessly and export it for SceneKit.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py

Outputs:
  Sources/CuteAC/Resources/CuteAC.usdz   model used by the macOS app
  Model/renders/*.png                    pre-rendered previews (cold / hot / off)

Named nodes the app drives: Louver (hinge at its top edge), Display (a plane
with 0..1 UVs that receives the temperature texture) and Led. Keep these
names stable.
"""

import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USDZ_PATH = os.path.join(ROOT, 'Sources', 'CuteAC', 'Resources', 'CuteAC.usdz')
RENDER_DIR = os.path.join(ROOT, 'Model', 'renders')

# Wall split unit proportions (~3.2 : 1). Front faces -Y, up is +Z.
BODY_W, BODY_D, BODY_H = 1.8, 0.42, 0.56
FRONT_Y = -BODY_D / 2
TOP_Z = BODY_H / 2


def hex_color(value, alpha=1.0):
    value = value.lstrip('#')
    srgb = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*linear, alpha)


def material(name, color, roughness=0.6, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hex_color(color)
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = hex_color(emission)
        bsdf.inputs['Emission Strength'].default_value = strength
    return mat


def finish(obj, name, mat):
    obj.name = name
    obj.data.name = name
    obj.data.materials.append(mat)
    # Low-poly look: keep every face flat.
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def apply_all(obj):
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def chamfer_box(name, size, mat, location=(0, 0, 0), chamfer=0.0, segments=1):
    """Box with a single (or few) chamfer segments: the faceted low-poly edge."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if chamfer > 0:
        modifier = obj.modifiers.new('Bevel', 'BEVEL')
        modifier.width = chamfer
        modifier.segments = segments
        modifier.limit_method = 'NONE'
        apply_all(obj)
    return finish(obj, name, mat)


def faceted_panel(name, size, mat, location, bulge):
    """Front slab split into three horizontal facets that bow outwards."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    half_h = size[2] / 2
    for z in (-half_h / 3, half_h / 3):
        geom = mesh.verts[:] + mesh.edges[:] + mesh.faces[:]
        bmesh.ops.bisect_plane(mesh, geom=geom, plane_co=(0, 0, z), plane_no=(0, 0, 1))
    for vert in mesh.verts:
        if vert.co.y < 0:
            vert.co.y -= bulge * (1 - (vert.co.z / half_h) ** 2)
    mesh.to_mesh(obj.data)
    mesh.free()
    modifier = obj.modifiers.new('Bevel', 'BEVEL')
    modifier.width = 0.014
    modifier.segments = 1
    modifier.limit_method = 'ANGLE'
    apply_all(obj)
    return finish(obj, name, mat)


def set_origin(obj, point):
    """Move the object origin to a world-space point without moving the mesh."""
    offset = Vector(point) - obj.location
    obj.data.transform(Matrix.Translation(-offset))
    obj.location = Vector(point)


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    shell = material('Shell', '#EEF1F6')
    panel = material('Panel', '#FBFCFE', roughness=0.45)
    trim = material('Trim', '#C9D2E1')
    grille = material('Grille', '#A9B4C7')
    outlet = material('Outlet', '#3E475C', roughness=0.8)
    louver_mat = material('LouverMat', '#DFE5EF', roughness=0.5)
    bezel = material('Bezel', '#2A3142', roughness=0.3)
    screen = material('Screen', '#11161F', roughness=0.2, emission='#5AA9FF', strength=0.0)
    led = material('LedMat', '#5AA9FF', roughness=0.2, emission='#5AA9FF', strength=4.0)
    badge = material('Badge', '#7C8BA8', roughness=0.4)

    # Main chassis: two chamfer segments read as "rounded" while staying faceted.
    chamfer_box('Body', (BODY_W, BODY_D, BODY_H), shell, chamfer=0.09, segments=2)

    # Front panel slab, slightly proud of the chassis, upper three quarters.
    panel_h = 0.36
    panel_z = 0.07
    faceted_panel('FrontPanel', (BODY_W - 0.1, 0.04, panel_h), panel,
                  location=(0, FRONT_Y - 0.006, panel_z), bulge=0.028)

    # Seam line under the panel.
    chamfer_box('Seam', (BODY_W - 0.16, 0.02, 0.012), trim,
                location=(0, FRONT_Y - 0.012, panel_z - panel_h / 2 - 0.012))

    # Top intake grille: chunky bars running left-right.
    for index in range(5):
        y = -0.09 + index * 0.05
        chamfer_box(f'GrilleBar{index}', (BODY_W - 0.36, 0.028, 0.016), grille,
                    location=(0, y, TOP_Z - 0.002), chamfer=0.005)

    # Air outlet recess along the bottom front edge.
    outlet_z = -0.205
    chamfer_box('Outlet', (1.5, 0.12, 0.075), outlet,
                location=(0, FRONT_Y + 0.03, outlet_z), chamfer=0.012)

    # Louver flap, hinged along its top edge so the app can rotate it about X.
    louver = chamfer_box('Louver', (1.54, 0.028, 0.095), louver_mat,
                         location=(0, FRONT_Y - 0.03, outlet_z - 0.005), chamfer=0.01)
    set_origin(louver, (0, FRONT_Y - 0.03, outlet_z + 0.042))

    # Display window on the right of the front panel.
    display_x, display_z = 0.56, 0.12
    chamfer_box('DisplayBezel', (0.3, 0.02, 0.13), bezel,
                location=(display_x, FRONT_Y - 0.056, display_z), chamfer=0.012)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(display_x, FRONT_Y - 0.0675, display_z),
                                     rotation=(math.radians(90), 0, 0))
    display = bpy.context.active_object
    display.scale = (0.25, 0.1, 1)
    apply_all(display)
    finish(display, 'Display', screen)

    chamfer_box('Led', (0.026, 0.012, 0.026), led,
                location=(display_x + 0.19, FRONT_Y - 0.056, display_z - 0.04), chamfer=0.004)

    # Small badge on the left so the front does not read as blank.
    chamfer_box('Badge', (0.16, 0.012, 0.03), badge,
                location=(-0.66, FRONT_Y - 0.05, 0.17), chamfer=0.006)

    return {'led': led, 'screen': screen}


def export_usdz():
    os.makedirs(os.path.dirname(USDZ_PATH), exist_ok=True)
    bpy.ops.wm.usd_export(
        filepath=USDZ_PATH,
        export_materials=True,
        generate_preview_surface=True,
        export_animation=False,
        export_cameras=False,
        export_lights=False,
        export_uvmaps=True,
        export_normals=True,
        convert_orientation=True,
        export_global_forward_selection='NEGATIVE_Z',
        export_global_up_selection='Y',
    )


def render_previews(materials):
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 960
    scene.render.resolution_y = 600
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'

    world = bpy.data.worlds.new('World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = hex_color('#E8EDF7')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.5
    scene.world = world

    bpy.ops.object.light_add(type='SUN', location=(0, 0, 3))
    key = bpy.context.active_object
    key.data.energy = 3.2
    key.rotation_euler = (math.radians(50), math.radians(-12), math.radians(-30))

    bpy.ops.object.camera_add(location=(0.9, -3.4, -0.75))
    camera = bpy.context.active_object
    direction = Vector((0, 0, 0.02)) - camera.location
    camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = 62
    scene.camera = camera

    louver = bpy.data.objects['Louver']
    led_bsdf = materials['led'].node_tree.nodes['Principled BSDF']
    screen_bsdf = materials['screen'].node_tree.nodes['Principled BSDF']

    states = {
        'cold': {'louver': 40, 'led': '#5AA9FF', 'glow': 4.0},
        'hot': {'louver': 40, 'led': '#FF9F5A', 'glow': 4.0},
        'off': {'louver': 0, 'led': '#8E97AA', 'glow': 0.0},
    }
    for name, state in states.items():
        louver.rotation_euler = (math.radians(state['louver']), 0, 0)
        for bsdf in (led_bsdf, screen_bsdf):
            bsdf.inputs['Emission Color'].default_value = hex_color(state['led'])
        led_bsdf.inputs['Base Color'].default_value = hex_color(state['led'])
        led_bsdf.inputs['Emission Strength'].default_value = state['glow']
        screen_bsdf.inputs['Emission Strength'].default_value = state['glow'] * 0.15
        scene.render.filepath = os.path.join(RENDER_DIR, f'{name}.png')
        bpy.ops.render.render(write_still=True)

    louver.rotation_euler = (0, 0, 0)


materials = build()
export_usdz()
render_previews(materials)
print('Exported', USDZ_PATH)
