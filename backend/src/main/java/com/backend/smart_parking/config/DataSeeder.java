package com.backend.smart_parking.config;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.smart_parking.parking.Gate;
import com.backend.smart_parking.parking.GateRepository;
import com.backend.smart_parking.parking.ParkingLot;
import com.backend.smart_parking.parking.ParkingLotRepository;
import com.backend.smart_parking.parking.ParkingSlot;
import com.backend.smart_parking.parking.ParkingSlotRepository;
import com.backend.smart_parking.parking.SlotStatus;
import com.backend.smart_parking.parking.SlotType;

@Component
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final ParkingLotRepository lotRepo;
    private final GateRepository       gateRepo;
    private final ParkingSlotRepository slotRepo;

    public DataSeeder(ParkingLotRepository lotRepo,
                      GateRepository gateRepo,
                      ParkingSlotRepository slotRepo) {
        this.lotRepo  = lotRepo;
        this.gateRepo = gateRepo;
        this.slotRepo = slotRepo;
    }

    record LotDef(String name, String address, double lat, double lng, int rate) {}

    private static final List<LotDef> LOTS = List.of(
        new LotDef("Cairo Festival City Mall",    "Ring Road, New Cairo",               30.030, 31.430, 10),
        new LotDef("Mall of Arabia",              "6th of October, Giza",               30.010, 30.980,  8),
        new LotDef("Cairo International Airport", "Cairo Airport Road, Heliopolis",     30.110, 31.400, 15),
        new LotDef("American University in Cairo","AUC Ave, New Cairo",                 30.020, 31.500,  5),
        new LotDef("Tahrir Square Parking",       "Tahrir Square, Downtown Cairo",      30.044, 31.236,  6),
        new LotDef("City Stars Mall",             "Omar Ibn El Khattab St, Heliopolis", 30.090, 31.340, 10),
        new LotDef("Cairo University",            "Gamaa St, Giza",                     30.026, 31.213,  4),
        new LotDef("Zamalek Street Parking",      "26th July St, Zamalek",              30.062, 31.220,  7)
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        List<ParkingLot> existing = lotRepo.findAll();

        if (existing.isEmpty()) {
            log.info("No parking lots found — seeding full dataset…");
            LOTS.forEach(def -> createLotWithGateAndSlots(def, null));
            log.info("Seeded {} parking lots.", LOTS.size());
            return;
        }

        // Lots exist (possibly placeholder rows) — ensure every lot has a gate and slots.
        int fixed = 0;
        for (int i = 0; i < existing.size(); i++) {
            ParkingLot lot = existing.get(i);
            boolean changed = false;

            // Back-fill missing metadata from our definitions if the lot looks like a placeholder
            if (lot.getHourlyRate() == null || lot.getHourlyRate().compareTo(BigDecimal.ZERO) == 0
                    || lot.getOpeningTime() == null) {
                LotDef def = LOTS.get(Math.min(i, LOTS.size() - 1));
                lot.setHourlyRate(BigDecimal.valueOf(def.rate()));
                lot.setOpeningTime(LocalTime.of(6, 0));
                lot.setClosingTime(LocalTime.of(23, 0));
                if (lot.getName() == null || lot.getName().isBlank()) lot.setName(def.name());
                if (lot.getAddress() == null || lot.getAddress().isBlank()) lot.setAddress(def.address());
                if (lot.getAmenities() == null) lot.setAmenities(new ArrayList<>());
                lotRepo.save(lot);
                changed = true;
            }

            // Add a gate if the lot has none
            if (gateRepo.findAllByParkingLotIdAndIsActiveTrue(lot.getId()).isEmpty()) {
                Gate gate = new Gate();
                gate.setName("Main Entrance - " + lot.getName());
                gate.setLocation(lot.getAddress());
                gate.setActive(true);
                gate.setParkingLot(lot);
                gateRepo.save(gate);
                changed = true;
            }

            // Add slots if the lot has none
            if (slotRepo.countByParkingLotId(lot.getId()) == 0) {
                addSlots(lot, 20);
                changed = true;
            }

            if (changed) fixed++;
        }

        // If we have fewer than 8 lots, create the missing ones
        if (existing.size() < LOTS.size()) {
            for (int i = existing.size(); i < LOTS.size(); i++) {
                createLotWithGateAndSlots(LOTS.get(i), null);
            }
            log.info("Created {} additional parking lots.", LOTS.size() - existing.size());
        }

        if (fixed > 0) log.info("Back-filled gates/slots for {} existing parking lots.", fixed);
    }

    private void createLotWithGateAndSlots(LotDef def, ParkingLot existingLot) {
        ParkingLot lot = existingLot != null ? existingLot : new ParkingLot();
        lot.setName(def.name());
        lot.setAddress(def.address());
        lot.setLatitude(def.lat());
        lot.setLongitude(def.lng());
        lot.setHourlyRate(BigDecimal.valueOf(def.rate()));
        lot.setOpeningTime(LocalTime.of(6, 0));
        lot.setClosingTime(LocalTime.of(23, 0));
        lot.setNumberOfGates(1);
        lot.setAmenities(new ArrayList<>());
        lotRepo.save(lot);

        Gate gate = new Gate();
        gate.setName("Main Entrance - " + def.name());
        gate.setLocation(def.address());
        gate.setActive(true);
        gate.setParkingLot(lot);
        gateRepo.save(gate);

        addSlots(lot, 20);
    }

    private void addSlots(ParkingLot lot, int count) {
        for (int i = 1; i <= count; i++) {
            ParkingSlot slot = new ParkingSlot();
            slot.setParkingLot(lot);
            slot.setSlotLabel(String.format("A%02d", i));
            slot.setSlotType(i == 1 ? SlotType.EV
                           : i == 2 ? SlotType.EV
                           : i == 3 ? SlotType.DISABLED
                           :          SlotType.REGULAR);
            slot.setStatus(i <= 12 ? SlotStatus.AVAILABLE : SlotStatus.OCCUPIED);
            slotRepo.save(slot);
        }
    }
}
