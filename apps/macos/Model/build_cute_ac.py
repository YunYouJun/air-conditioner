"""
Build the low-poly cartoon air conditioners headlessly and export them for
SceneKit / RealityKit.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py
    /Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py -- tower

Pass form names after `--` to build only those (default: wall and tower).

Outputs:
  Kit/Sources/CuteACKit/Resources/CuteAC.usdz        wall split unit (挂机)
  Kit/Sources/CuteACKit/Resources/CuteACTower.usdz   floor-standing tower (柜机)
  Model/renders/<form>-*.png                         previews (cold / hot / off)

Named nodes the apps drive, identical in both forms: Louver, Display (a
0.25 x 0.1 plane with 0..1 UVs that receives the temperature texture) and
Led. The wall louver is one flap hinged along its top edge that turns about
local X. The tower louver is a group of horizontal blinds: each child blade
turns about its own local X. Keep these names stable.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES = os.path.join(ROOT, 'Kit', 'Sources', 'CuteACKit', 'Resources')
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


def faceted_panel(name, size, mat, location, bulge, axis=2):
    """Front slab split into three facets that bow outwards: horizontal
    facets (axis=2, along Z) for the wall unit, vertical ones (axis=0,
    along X) for the tower."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    half = size[axis] / 2
    normal = [0, 0, 0]
    normal[axis] = 1
    for offset in (-half / 3, half / 3):
        geom = mesh.verts[:] + mesh.edges[:] + mesh.faces[:]
        point = [0, 0, 0]
        point[axis] = offset
        bmesh.ops.bisect_plane(mesh, geom=geom, plane_co=point, plane_no=normal)
    for vert in mesh.verts:
        if vert.co.y < 0:
            vert.co.y -= bulge * (1 - (vert.co[axis] / half) ** 2)
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


def materials():
    return {
        'shell': material('Shell', '#EEF1F6'),
        'panel': material('Panel', '#FBFCFE', roughness=0.45),
        'trim': material('Trim', '#C9D2E1'),
        'grille': material('Grille', '#A9B4C7'),
        'outlet': material('Outlet', '#3E475C', roughness=0.8),
        'louver': material('LouverMat', '#DFE5EF', roughness=0.5),
        'bezel': material('Bezel', '#2A3142', roughness=0.3),
        'screen': material('Screen', '#11161F', roughness=0.2, emission='#5AA9FF', strength=0.0),
        'led': material('LedMat', '#5AA9FF', roughness=0.2, emission='#5AA9FF', strength=4.0),
        'badge': material('Badge', '#7C8BA8', roughness=0.4),
    }


def display_window(bezel_mat, screen_mat, x, front, z):
    """Bezel plus the 0.25 x 0.1 Display plane the apps paint the LCD onto."""
    chamfer_box('DisplayBezel', (0.3, 0.02, 0.13), bezel_mat, location=(x, front, z), chamfer=0.012)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, front - 0.0115, z),
                                     rotation=(math.radians(90), 0, 0))
    display = bpy.context.active_object
    display.scale = (0.25, 0.1, 1)
    apply_all(display)
    finish(display, 'Display', screen_mat)


def build_wall():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = materials()
    shell, panel, trim, grille = mats['shell'], mats['panel'], mats['trim'], mats['grille']
    outlet, louver_mat, bezel, screen = mats['outlet'], mats['louver'], mats['bezel'], mats['screen']
    led, badge = mats['led'], mats['badge']

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
    display_window(bezel, screen, display_x, FRONT_Y - 0.056, display_z)

    chamfer_box('Led', (0.026, 0.012, 0.026), led,
                location=(display_x + 0.19, FRONT_Y - 0.056, display_z - 0.04), chamfer=0.004)

    # Small badge on the left so the front does not read as blank.
    chamfer_box('Badge', (0.16, 0.012, 0.03), badge,
                location=(-0.66, FRONT_Y - 0.05, 0.17), chamfer=0.006)

    return {'led': led, 'screen': screen}


# Floor-standing tower (~1 : 3.4), same conventions: front faces -Y, up is +Z,
# centred on the origin so both forms load at the same place.
TOWER_W, TOWER_D, TOWER_H = 0.52, 0.34, 1.76
TOWER_FRONT_Y = -TOWER_D / 2
TOWER_TOP_Z = TOWER_H / 2
# Tall outlet in the upper half, covered by the Louver flap.
TOWER_OUTLET = {'w': 0.36, 'h': 0.54, 'z': 0.24}


def build_tower():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = materials()

    chamfer_box('Body', (TOWER_W, TOWER_D, TOWER_H), mats['shell'], chamfer=0.07, segments=2)
    # A slightly wider foot so it reads as standing on the floor.
    chamfer_box('Base', (TOWER_W + 0.03, TOWER_D + 0.03, 0.07), mats['trim'],
                location=(0, 0, -TOWER_TOP_Z + 0.035), chamfer=0.02)

    # Top intake grille, bars running left-right like the wall unit's.
    for index in range(4):
        y = -0.1 + index * 0.066
        chamfer_box(f'GrilleBar{index}', (TOWER_W - 0.16, 0.028, 0.016), mats['grille'],
                    location=(0, y, TOWER_TOP_Z - 0.002), chamfer=0.005)

    # Display window near the top, where a standing person looks.
    display_window(mats['bezel'], mats['screen'], 0, TOWER_FRONT_Y - 0.012, 0.64)
    chamfer_box('Led', (0.026, 0.012, 0.026), mats['led'],
                location=(0.19, TOWER_FRONT_Y - 0.012, 0.56), chamfer=0.004)

    # Outlet recess with fixed vertical vanes, visible between the blinds.
    outlet = TOWER_OUTLET
    chamfer_box('Outlet', (outlet['w'], 0.1, outlet['h']), mats['outlet'],
                location=(0, TOWER_FRONT_Y + 0.03, outlet['z']), chamfer=0.012)
    for index in range(5):
        x = (index - 2) * 0.065
        chamfer_box(f'Vane{index}', (0.012, 0.05, outlet['h'] - 0.06), mats['grille'],
                    location=(x, TOWER_FRONT_Y - 0.004, outlet['z']), chamfer=0.003)

    # Louver: horizontal blinds across the outlet, closed flat when off. The
    # parent empty groups them; each blade pivots about its own centre line.
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, TOWER_FRONT_Y - 0.03, outlet['z']))
    louver = bpy.context.active_object
    louver.name = 'Louver'
    blades = 6
    pitch = (outlet['h'] + 0.02) / blades
    for index in range(blades):
        z = outlet['z'] + outlet['h'] / 2 + 0.01 - pitch * (index + 0.5)
        blade = chamfer_box(f'Blade{index}', (outlet['w'] + 0.02, 0.02, pitch - 0.006), mats['louver'],
                            location=(0, TOWER_FRONT_Y - 0.03, z), chamfer=0.006)
        # chamfer_box bakes its location into the vertices; give each blade
        # its own origin on its centre line (the pivot), then place it
        # relative to the group.
        set_origin(blade, (0, TOWER_FRONT_Y - 0.03, z))
        blade.parent = louver
        blade.matrix_parent_inverse = Matrix.Identity(4)
        blade.location = (0, 0, z - outlet['z'])

    # Lower front panel with three vertical facets, plus the badge. It stops
    # short of the flap so its bulge never pokes through the closed flap.
    panel_h = 0.68
    panel_z = -TOWER_TOP_Z + 0.12 + panel_h / 2
    faceted_panel('FrontPanel', (TOWER_W - 0.08, 0.04, panel_h), mats['panel'],
                  location=(0, TOWER_FRONT_Y - 0.006, panel_z), bulge=0.022, axis=0)
    chamfer_box('Seam', (TOWER_W - 0.14, 0.02, 0.012), mats['trim'],
                location=(0, TOWER_FRONT_Y - 0.012, panel_z + panel_h / 2 + 0.03))
    chamfer_box('Badge', (0.14, 0.012, 0.03), mats['badge'],
                location=(0, TOWER_FRONT_Y - 0.04, panel_z + 0.22), chamfer=0.006)

    return {'led': mats['led'], 'screen': mats['screen']}


FORMS = {
    # build, usdz name, preview camera (location, target, lens), louver (axis index, open angle)
    'wall': (build_wall, 'CuteAC.usdz', ((0.9, -3.4, -0.75), (0, 0, 0.02), 62), (0, 40)),
    'tower': (build_tower, 'CuteACTower.usdz', ((1.1, -5.6, 0.9), (0, 0, 0.0), 58), (0, 30)),
}


def export_usdz(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.wm.usd_export(
        filepath=path,
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


def render_previews(form, materials, camera_spec, louver_spec):
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

    location, target, lens = camera_spec
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.active_object
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = lens
    scene.camera = camera

    louver = bpy.data.objects['Louver']
    # The tower's blinds turn individually; the wall flap turns as a whole.
    movers = list(louver.children) or [louver]
    led_bsdf = materials['led'].node_tree.nodes['Principled BSDF']
    screen_bsdf = materials['screen'].node_tree.nodes['Principled BSDF']

    states = {
        'cold': {'louver': 40, 'led': '#5AA9FF', 'glow': 4.0},
        'hot': {'louver': 40, 'led': '#FF9F5A', 'glow': 4.0},
        'off': {'louver': 0, 'led': '#8E97AA', 'glow': 0.0},
    }
    axis, open_angle = louver_spec
    if form == 'tower':
        scene.render.resolution_x, scene.render.resolution_y = 600, 960
    for name, state in states.items():
        rotation = [0, 0, 0]
        rotation[axis] = math.radians(open_angle if state['louver'] else 0)
        for mover in movers:
            mover.rotation_euler = rotation
        for bsdf in (led_bsdf, screen_bsdf):
            bsdf.inputs['Emission Color'].default_value = hex_color(state['led'])
        led_bsdf.inputs['Base Color'].default_value = hex_color(state['led'])
        led_bsdf.inputs['Emission Strength'].default_value = state['glow']
        screen_bsdf.inputs['Emission Strength'].default_value = state['glow'] * 0.15
        scene.render.filepath = os.path.join(RENDER_DIR, f'{form}-{name}.png')
        bpy.ops.render.render(write_still=True)

    for mover in movers:
        mover.rotation_euler = (0, 0, 0)


requested = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(FORMS)
for form in requested:
    build, file_name, camera_spec, louver_spec = FORMS[form]
    form_materials = build()
    path = os.path.join(RESOURCES, file_name)
    export_usdz(path)
    render_previews(form, form_materials, camera_spec, louver_spec)
    print('Exported', path)
