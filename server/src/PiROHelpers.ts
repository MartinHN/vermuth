import path from 'path'
import { execSync, execFileSync } from "child_process"
import { readFileSync, writeFileSync } from 'fs'
const proc = execSync("uname -a").toString()
export const isPi = proc.includes("armv7")

export function isRW() {
    try {
        const out = execSync("mount | grep 'type ext4' | grep rw")
        if (out) { return true }
    } catch (e) {

    }
    return false
}

export const bootedInRW = isRW()

export function setRW(isRW) {
    if (bootedInRW) {
        console.log('ignoring rw as it was booted rw')
        return;
    }
    if (isPi) {
        const rwStr = isRW ? "rw" : "ro";
        const out = execSync(`sudo mount -o remount,${rwStr} /`, { shell: true })
        if (out) console.log("rw out", out.toString());
    }
}
